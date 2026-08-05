import { NextRequest } from "next/server";
import { apiError } from "@/lib/utils";
import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/schemas";

export async function GET() {
  const user = await getAppUser();
  if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);
  return Response.json({ user });
}

export async function PATCH(req: NextRequest) {
  const user = await getAppUser();
  if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);
  if (user.isGuest) {
    return apiError("FORBIDDEN", "Guests cannot edit profiles", 403);
  }

  const body = await req.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid", 400);
  }

  if (parsed.data.username && parsed.data.username !== user.username) {
    const taken = await prisma.user.findUnique({
      where: { username: parsed.data.username },
    });
    if (taken) return apiError("CONFLICT", "Username taken", 409);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(parsed.data.username !== undefined && { username: parsed.data.username }),
      ...(parsed.data.bio !== undefined && { bio: parsed.data.bio }),
      ...(parsed.data.avatarUrl !== undefined && { avatarUrl: parsed.data.avatarUrl }),
      ...(parsed.data.favoriteGenres !== undefined && {
        favoriteGenres: parsed.data.favoriteGenres,
      }),
      ...(parsed.data.country !== undefined && { country: parsed.data.country }),
    },
  });

  return Response.json({ user: updated });
}
