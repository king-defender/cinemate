import { NextRequest } from "next/server";
import { apiError } from "@/lib/utils";
import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

type Params = { params: Promise<{ id: string }> };

const MAX_CAMERA_USERS = 4;

export async function POST(_req: NextRequest, { params }: Params) {
  const user = await getAppUser();
  if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

  const { id } = await params;
  const room = await prisma.room.findUnique({
    where: { id },
    include: { _count: { select: { members: true } } },
  });

  if (!room || room.endedAt) {
    return apiError("NOT_FOUND", "Room not found or ended", 404);
  }

  const already = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId: id, userId: user.id } },
  });

  if (already) {
    return Response.json({ ok: true, status: "approved", roomId: id });
  }

  // Host always enters without approval
  if (room.hostId === user.id) {
    await prisma.roomMember.upsert({
      where: { roomId_userId: { roomId: id, userId: user.id } },
      create: { roomId: id, userId: user.id },
      update: {},
    });
    return Response.json({ ok: true, status: "approved", roomId: id });
  }

  if (room._count.members >= MAX_CAMERA_USERS) {
    return apiError("FORBIDDEN", "Room is full (max 4 participants)", 403);
  }

  const existing = await prisma.roomJoinRequest.findUnique({
    where: { roomId_userId: { roomId: id, userId: user.id } },
  });

  if (existing?.status === "approved") {
    // Stale approved without membership — re-open request
  }

  if (existing?.status === "pending") {
    return Response.json({
      ok: true,
      status: "pending",
      roomId: id,
      requestId: existing.id,
    });
  }

  const request = existing
    ? await prisma.roomJoinRequest.update({
        where: { id: existing.id },
        data: { status: "pending", resolvedAt: null, createdAt: new Date() },
      })
    : await prisma.roomJoinRequest.create({
        data: { roomId: id, userId: user.id, status: "pending" },
      });

  const detailBits = [
    user.phone ?? null,
    user.bio ? user.bio.slice(0, 80) : null,
    user.favoriteGenres.length
      ? user.favoriteGenres.slice(0, 3).join(", ")
      : null,
    user.country ?? null,
    user.isGuest ? "Guest account" : null,
  ].filter(Boolean);

  await createNotification({
    userId: room.hostId,
    type: "join_request",
    title: `@${user.username} wants to join`,
    body: detailBits.length
      ? detailBits.join(" · ")
      : room.title ?? "Watch session",
    href: `/rooms/${room.id}`,
  });

  return Response.json({
    ok: true,
    status: "pending",
    roomId: id,
    requestId: request.id,
  });
}

/** Requester polls approval status */
export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getAppUser();
  if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

  const { id } = await params;

  const member = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId: id, userId: user.id } },
  });
  if (member) {
    return Response.json({ status: "approved", roomId: id });
  }

  const request = await prisma.roomJoinRequest.findUnique({
    where: { roomId_userId: { roomId: id, userId: user.id } },
  });

  if (!request) {
    return Response.json({ status: "none", roomId: id });
  }

  // Approved but not a member anymore (e.g. kicked) — treat as not in
  if (request.status === "approved") {
    return Response.json({ status: "none", roomId: id });
  }

  return Response.json({
    status: request.status,
    roomId: id,
    requestId: request.id,
  });
}
