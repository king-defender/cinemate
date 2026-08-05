import { NextRequest } from "next/server";
import { apiError } from "@/lib/utils";
import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getAppUser();
  if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

  const communities = await prisma.community.findMany({
    include: {
      _count: { select: { members: true } },
      members: {
        where: { userId: user.id },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  return Response.json({
    communities: communities.map((c) => ({
      id: c.id,
      name: c.name,
      genre: c.genre,
      memberCount: c._count.members,
      joined: c.members.length > 0,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getAppUser();
  if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);
  if (user.isGuest) {
    return apiError("FORBIDDEN", "Guests cannot join communities", 403);
  }

  const body = (await req.json().catch(() => null)) as {
    communityId?: string;
    action?: "join" | "leave";
  } | null;

  if (!body?.communityId || !body.action) {
    return apiError("VALIDATION", "communityId and action required", 400);
  }

  const community = await prisma.community.findUnique({
    where: { id: body.communityId },
  });
  if (!community) return apiError("NOT_FOUND", "Community not found", 404);

  if (body.action === "join") {
    await prisma.communityMember.upsert({
      where: {
        communityId_userId: {
          communityId: body.communityId,
          userId: user.id,
        },
      },
      create: { communityId: body.communityId, userId: user.id },
      update: {},
    });
  } else {
    await prisma.communityMember.deleteMany({
      where: { communityId: body.communityId, userId: user.id },
    });
  }

  return Response.json({ ok: true });
}
