import { NextRequest } from "next/server";
import { apiError } from "@/lib/utils";
import { getAppUser, canHostOrBuddy } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buddyRequestSchema } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET() {
  const user = await getAppUser();
  if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

  const [open, mine] = await Promise.all([
    prisma.buddyRequest.findMany({
      where: { status: "open", requesterId: { not: user.id } },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            bio: true,
            favoriteGenres: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.buddyRequest.findMany({
      where: { requesterId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return Response.json({ open, mine });
}

export async function POST(req: NextRequest) {
  const user = await getAppUser();
  if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);
  if (!canHostOrBuddy(user)) {
    return apiError(
      "FORBIDDEN",
      "Verify your email before posting buddy requests",
      403,
    );
  }

  const limit = await checkRateLimit(`buddy:${user.id}`, 5);
  if (!limit.ok) {
    return apiError("RATE_LIMITED", "Too many buddy requests this hour", 429);
  }

  const body = await req.json().catch(() => ({}));
  const parsed = buddyRequestSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid", 400);
  }

  const existing = await prisma.buddyRequest.findFirst({
    where: { requesterId: user.id, status: "open" },
  });
  if (existing) {
    return apiError("CONFLICT", "You already have an open request", 409);
  }

  const request = await prisma.buddyRequest.create({
    data: {
      requesterId: user.id,
      tags: parsed.data.tags,
    },
  });

  return Response.json({ request });
}
