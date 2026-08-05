import { apiError } from "@/lib/utils";
import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string; userId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

  const { id, userId } = await params;
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room || room.endedAt) {
    return apiError("NOT_FOUND", "Room not found", 404);
  }
  if (room.hostId !== user.id) {
    return apiError("FORBIDDEN", "Only the host can remove participants", 403);
  }
  if (userId === room.hostId) {
    return apiError("FORBIDDEN", "Cannot remove the host", 403);
  }

  await prisma.roomMember.deleteMany({
    where: { roomId: id, userId },
  });

  return Response.json({ ok: true });
}
