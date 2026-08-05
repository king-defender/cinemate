import { NextRequest } from "next/server";
import { apiError } from "@/lib/utils";
import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluateBadges } from "@/lib/badges/evaluate";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const user = await getAppUser();
  if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

  const { id } = await params;
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) return apiError("NOT_FOUND", "Room not found", 404);
  if (room.hostId !== user.id) {
    return apiError("FORBIDDEN", "Only the host can end the room", 403);
  }
  if (room.endedAt) {
    return Response.json({ ok: true, alreadyEnded: true });
  }

  await prisma.room.update({
    where: { id },
    data: { endedAt: new Date() },
  });

  await evaluateBadges(user.id);

  return Response.json({ ok: true });
}
