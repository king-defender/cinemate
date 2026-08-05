import { NextRequest } from "next/server";
import { apiError } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { completeProfileSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const authOnly = data.user;

  if (!authOnly) return apiError("UNAUTHORIZED", "Not authenticated", 401);

  const body = await req.json().catch(() => null);
  const parsed = completeProfileSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid", 400);
  }

  const { username, bio, favoriteGenres, country } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing && existing.id !== authOnly.id) {
    return apiError("CONFLICT", "Username taken", 409);
  }

  const emailVerified = Boolean(authOnly.email_confirmed_at);
  const isGuest = authOnly.is_anonymous === true;

  const appUser = await prisma.user.upsert({
    where: { id: authOnly.id },
    create: {
      id: authOnly.id,
      email: authOnly.email ?? `${authOnly.id}@guest.cinemate.local`,
      emailVerified,
      username,
      bio: bio ?? null,
      favoriteGenres: favoriteGenres ?? [],
      country: country ?? null,
      isGuest,
    },
    update: {
      username,
      bio: bio ?? null,
      favoriteGenres: favoriteGenres ?? [],
      country: country ?? null,
      emailVerified,
    },
  });

  return Response.json({ user: appUser });
}
