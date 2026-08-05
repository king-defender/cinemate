import { apiError } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ inviteCode: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { inviteCode } = await params;
  const room = await prisma.room.findUnique({
    where: { inviteCode: inviteCode.toUpperCase() },
    include: {
      host: { select: { username: true, avatarUrl: true } },
      _count: { select: { members: true } },
    },
  });

  if (!room || room.endedAt) {
    return apiError("NOT_FOUND", "Invalid or expired invite", 404);
  }

  return Response.json({
    id: room.id,
    inviteCode: room.inviteCode,
    title: room.title,
    host: room.host,
    memberCount: room._count.members,
  });
}
