import { apiError } from "@/lib/utils";
import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getAppUser();
  if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

  const memberships = await prisma.roomMember.findMany({
    where: {
      userId: user.id,
      room: { endedAt: { not: null } },
    },
    include: {
      room: {
        include: {
          host: { select: { username: true, avatarUrl: true } },
          members: {
            include: {
              user: { select: { username: true, avatarUrl: true } },
            },
          },
          _count: { select: { messages: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
    take: 50,
  });

  const history = memberships.map((m) => {
    const started = m.room.createdAt.getTime();
    const ended = m.room.endedAt?.getTime() ?? started;
    return {
      roomId: m.room.id,
      title: m.room.title ?? "Watch session",
      inviteCode: m.room.inviteCode,
      host: m.room.host,
      participants: m.room.members.map((mem) => mem.user),
      createdAt: m.room.createdAt,
      endedAt: m.room.endedAt,
      durationMinutes: Math.max(1, Math.round((ended - started) / 60000)),
      messageCount: m.room._count.messages,
      isBuddyMatch: m.room.isBuddyMatch,
    };
  });

  return Response.json({ history });
}
