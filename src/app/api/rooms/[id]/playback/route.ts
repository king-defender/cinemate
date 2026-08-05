import { NextRequest } from "next/server";
import { apiError } from "@/lib/utils";
import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { playbackSyncSchema } from "@/lib/schemas";

type Params = { params: Promise<{ id: string }> };

/** Members poll this when Realtime WebSocket is down */
export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getAppUser();
  if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

  const { id: roomId } = await params;
  const membership = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId: user.id } },
  });
  if (!membership) return apiError("FORBIDDEN", "Not a room member", 403);

  const state = await prisma.roomPlaybackState.findUnique({
    where: { roomId },
  });

  if (!state) {
    return Response.json({ state: null });
  }

  return Response.json({
    state: {
      positionSeconds: state.positionSeconds,
      isPlaying: state.isPlaying,
      speed: state.speed,
      updatedBy: state.updatedBy,
      updatedAt: state.updatedAt,
      sentAt: Date.now(),
    },
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getAppUser();
  if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

  const { id: roomId } = await params;
  const membership = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId: user.id } },
  });
  if (!membership) return apiError("FORBIDDEN", "Not a room member", 403);

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room || room.endedAt) {
    return apiError("NOT_FOUND", "Room unavailable", 404);
  }
  const controllerId = room.controllerId ?? room.hostId;
  if (user.id !== controllerId && user.id !== room.hostId) {
    return apiError(
      "FORBIDDEN",
      "Only the approved controller can sync playback",
      403,
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = playbackSyncSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid", 400);
  }

  const state = await prisma.roomPlaybackState.upsert({
    where: { roomId },
    create: {
      roomId,
      ...parsed.data,
      updatedBy: user.id,
    },
    update: {
      ...parsed.data,
      updatedBy: user.id,
    },
  });

  return Response.json({ state });
}
