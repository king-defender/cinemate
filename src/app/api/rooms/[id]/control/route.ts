import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/utils";
import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

type Params = { params: Promise<{ id: string }> };

const grantSchema = z.object({
  userId: z.string().uuid(),
});

/** Request play/stream control (non-host). Host is notified. */
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getAppUser();
  if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { action?: string };
  const action = body.action ?? "request";

  const room = await prisma.room.findUnique({ where: { id } });
  if (!room || room.endedAt) {
    return apiError("NOT_FOUND", "Room not found", 404);
  }

  const membership = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId: id, userId: user.id } },
  });
  if (!membership) return apiError("FORBIDDEN", "Not a room member", 403);

  if (action === "request") {
    if (user.id === room.hostId) {
      return apiError("FORBIDDEN", "Host already has control", 403);
    }
    const controllerId = room.controllerId ?? room.hostId;
    if (controllerId === user.id) {
      return Response.json({ ok: true, alreadyController: true });
    }

    await createNotification({
      userId: room.hostId,
      type: "control_request",
      title: `@${user.username} wants play control`,
      body: "Approve them to control playback / screen share",
      href: `/rooms/${room.id}`,
    });

    return Response.json({
      ok: true,
      requested: true,
      requesterId: user.id,
      username: user.username,
    });
  }

  if (action === "reclaim") {
    if (user.id !== room.hostId) {
      return apiError("FORBIDDEN", "Only the host can reclaim control", 403);
    }
    await prisma.room.update({
      where: { id },
      data: { controllerId: room.hostId },
    });
    return Response.json({ ok: true, controllerId: room.hostId });
  }

  return apiError("VALIDATION", "Unknown action", 400);
}

/** Host grants or revokes control */
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getAppUser();
  if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

  const { id } = await params;
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room || room.endedAt) {
    return apiError("NOT_FOUND", "Room not found", 404);
  }
  if (user.id !== room.hostId) {
    return apiError("FORBIDDEN", "Only the host can grant control", 403);
  }

  const body = await req.json().catch(() => null);
  const parsed = grantSchema.safeParse(body);
  if (!parsed.success) {
    // revoke → back to host
    if (body && body.revoke === true) {
      await prisma.room.update({
        where: { id },
        data: { controllerId: room.hostId },
      });
      return Response.json({ ok: true, controllerId: room.hostId });
    }
    return apiError("VALIDATION", "userId required", 400);
  }

  const member = await prisma.roomMember.findUnique({
    where: {
      roomId_userId: { roomId: id, userId: parsed.data.userId },
    },
  });
  if (!member) {
    return apiError("NOT_FOUND", "User is not in this room", 404);
  }

  await prisma.room.update({
    where: { id },
    data: { controllerId: parsed.data.userId },
  });

  await createNotification({
    userId: parsed.data.userId,
    type: "control_granted",
    title: "You can control the stream",
    body: "The host approved your play permission",
    href: `/rooms/${id}`,
  });

  return Response.json({ ok: true, controllerId: parsed.data.userId });
}
