import { NextRequest } from "next/server";
import { apiError } from "@/lib/utils";
import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatMessageSchema } from "@/lib/schemas";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
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

  const body = await req.json().catch(() => null);
  const parsed = chatMessageSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid", 400);
  }

  const message = await prisma.chatMessage.create({
    data: {
      roomId,
      userId: user.id,
      content: parsed.data.content,
    },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  return Response.json({ message });
}
