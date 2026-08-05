import { NextRequest } from "next/server";
import { apiError } from "@/lib/utils";
import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluateBadges } from "@/lib/badges/evaluate";
import { createNotification } from "@/lib/notifications";

type Params = { params: Promise<{ id: string }> };

const MAX_CAMERA_USERS = 4;

const requesterSelect = {
  id: true,
  username: true,
  avatarUrl: true,
  bio: true,
  phone: true,
  favoriteGenres: true,
  country: true,
  isGuest: true,
  emailVerified: true,
  createdAt: true,
} as const;

/** Host: list pending join requests with requester profile */
export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getAppUser();
  if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

  const { id } = await params;
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room || room.endedAt) {
    return apiError("NOT_FOUND", "Room not found or ended", 404);
  }
  if (room.hostId !== user.id) {
    return apiError("FORBIDDEN", "Only the host can view join requests", 403);
  }

  const requests = await prisma.roomJoinRequest.findMany({
    where: { roomId: id, status: "pending" },
    orderBy: { createdAt: "asc" },
    include: { user: { select: requesterSelect } },
  });

  return Response.json({
    requests: requests.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      requester: {
        id: r.user.id,
        username: r.user.username,
        avatarUrl: r.user.avatarUrl,
        bio: r.user.bio,
        phone: r.user.phone,
        favoriteGenres: r.user.favoriteGenres,
        country: r.user.country,
        isGuest: r.user.isGuest,
        emailVerified: r.user.emailVerified,
        memberSince: r.user.createdAt,
      },
    })),
  });
}

/** Host: approve or deny a join request */
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getAppUser();
  if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    requestId?: string;
    action?: "approve" | "deny";
  };

  if (!body.requestId || !body.action) {
    return apiError("BAD_REQUEST", "requestId and action required", 400);
  }

  const room = await prisma.room.findUnique({
    where: { id },
    include: { _count: { select: { members: true } } },
  });
  if (!room || room.endedAt) {
    return apiError("NOT_FOUND", "Room not found or ended", 404);
  }
  if (room.hostId !== user.id) {
    return apiError("FORBIDDEN", "Only the host can approve joins", 403);
  }

  const joinReq = await prisma.roomJoinRequest.findUnique({
    where: { id: body.requestId },
    include: { user: { select: { id: true, username: true } } },
  });

  if (!joinReq || joinReq.roomId !== id) {
    return apiError("NOT_FOUND", "Join request not found", 404);
  }
  if (joinReq.status !== "pending") {
    return apiError("CONFLICT", "Request already resolved", 409);
  }

  if (body.action === "deny") {
    await prisma.roomJoinRequest.update({
      where: { id: joinReq.id },
      data: { status: "denied", resolvedAt: new Date() },
    });
    await createNotification({
      userId: joinReq.userId,
      type: "join_denied",
      title: "Join request declined",
      body: room.title
        ? `Host declined your request for “${room.title}”`
        : "The host declined your join request",
      href: "/dashboard",
    });
    return Response.json({ ok: true, status: "denied" });
  }

  if (room._count.members >= MAX_CAMERA_USERS) {
    return apiError("FORBIDDEN", "Room is full (max 4 participants)", 403);
  }

  await prisma.$transaction([
    prisma.roomMember.upsert({
      where: {
        roomId_userId: { roomId: id, userId: joinReq.userId },
      },
      create: { roomId: id, userId: joinReq.userId },
      update: {},
    }),
    prisma.roomJoinRequest.update({
      where: { id: joinReq.id },
      data: { status: "approved", resolvedAt: new Date() },
    }),
  ]);

  await createNotification({
    userId: joinReq.userId,
    type: "join_approved",
    title: "You're in!",
    body: room.title
      ? `Host approved you for “${room.title}”`
      : "The host approved your join request",
    href: `/rooms/${id}`,
  });

  await evaluateBadges(joinReq.userId);

  return Response.json({
    ok: true,
    status: "approved",
    member: {
      id: joinReq.user.id,
      username: joinReq.user.username,
    },
  });
}
