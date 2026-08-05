import { apiError } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ username: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      bio: true,
      favoriteGenres: true,
      country: true,
      createdAt: true,
      isGuest: true,
      badges: {
        include: { badge: true },
        orderBy: { awardedAt: "desc" },
      },
    },
  });

  if (!user || user.isGuest) {
    return apiError("NOT_FOUND", "User not found", 404);
  }

  return Response.json({
    user: {
      ...user,
      badges: user.badges.map((b) => ({
        name: b.badge.name,
        description: b.badge.description,
        awardedAt: b.awardedAt,
      })),
    },
  });
}
