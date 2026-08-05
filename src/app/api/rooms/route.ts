import { NextRequest } from "next/server";
import { apiError, inviteCode } from "@/lib/utils";
import { getAppUser, canHostOrBuddy } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRoomSchema } from "@/lib/schemas";
import { evaluateBadges } from "@/lib/badges/evaluate";

export async function POST(req: NextRequest) {
  const user = await getAppUser();
  if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);
  if (!canHostOrBuddy(user)) {
    return apiError(
      "FORBIDDEN",
      "Verify your email before creating rooms",
      403,
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createRoomSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid", 400);
  }

  let code = inviteCode();
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.room.findUnique({ where: { inviteCode: code } });
    if (!clash) break;
    code = inviteCode();
  }

  const room = await prisma.room.create({
    data: {
      hostId: user.id,
      inviteCode: code,
      title: parsed.data.title ?? null,
      platform: parsed.data.platform ?? null,
      controllerId: user.id,
      members: { create: { userId: user.id } },
      playbackState: {
        create: {
          positionSeconds: 0,
          isPlaying: false,
          speed: 1,
          updatedBy: user.id,
        },
      },
    },
  });

  await evaluateBadges(user.id);

  return Response.json({ id: room.id, inviteCode: room.inviteCode });
}
