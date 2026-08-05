import { apiError } from "@/lib/utils";
import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

  const { id } = await params;
  const membership = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId: id, userId: user.id } },
  });
  if (!membership) {
    return apiError("FORBIDDEN", "Not a room member", 403);
  }

  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      host: { select: { id: true, username: true, avatarUrl: true } },
      members: {
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true, isGuest: true },
          },
        },
      },
      playbackState: true,
      messages: {
        orderBy: { createdAt: "asc" },
        take: 200,
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
      },
    },
  });

  if (!room) return apiError("NOT_FOUND", "Room not found", 404);

  return Response.json({ room });
}
