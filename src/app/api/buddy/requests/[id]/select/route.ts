import { NextRequest } from "next/server";
import { apiError, inviteCode } from "@/lib/utils";
import { getAppUser, canHostOrBuddy } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluateBadges } from "@/lib/badges/evaluate";
import { createNotification } from "@/lib/notifications";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const user = await getAppUser();
  if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);
  if (!canHostOrBuddy(user)) {
    return apiError("FORBIDDEN", "Verify your email first", 403);
  }

  const { id } = await params;
  const request = await prisma.buddyRequest.findUnique({ where: { id } });
  if (!request) return apiError("NOT_FOUND", "Request not found", 404);
  if (request.status !== "open") {
    return apiError("CONFLICT", "Request already matched or cancelled", 409);
  }
  if (request.requesterId === user.id) {
    return apiError("FORBIDDEN", "Cannot match with yourself", 403);
  }

  const code = inviteCode();
  const room = await prisma.$transaction(async (tx) => {
    const created = await tx.room.create({
      data: {
        hostId: user.id,
        inviteCode: code,
        title: "Movie buddy match",
        isBuddyMatch: true,
        controllerId: user.id,
        members: {
          create: [
            { userId: user.id },
            { userId: request.requesterId },
          ],
        },
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

    await tx.buddyRequest.update({
      where: { id },
      data: { status: "matched", matchedRoomId: created.id },
    });

    return created;
  });

  await createNotification({
    userId: request.requesterId,
    type: "buddy_match",
    title: `@${user.username} matched with you`,
    body: "Your movie buddy room is ready",
    href: `/rooms/${room.id}`,
  });

  await evaluateBadges(user.id);
  await evaluateBadges(request.requesterId);

  return Response.json({ roomId: room.id, inviteCode: room.inviteCode });
}
