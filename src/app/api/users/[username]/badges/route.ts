import { apiError } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ username: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { username } = await params;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || user.isGuest) {
    return apiError("NOT_FOUND", "User not found", 404);
  }

  const badges = await prisma.userBadge.findMany({
    where: { userId: user.id },
    include: { badge: true },
    orderBy: { awardedAt: "desc" },
  });

  return Response.json({
    badges: badges.map((b) => ({
      name: b.badge.name,
      description: b.badge.description,
      awardedAt: b.awardedAt,
    })),
  });
}
