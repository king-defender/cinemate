import { NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Prisma } from "@prisma/client";
import { apiError } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { completeProfileSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import type { User as AuthUser } from "@supabase/supabase-js";

async function resolveAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (data.user) return data.user;

  // Right after signUp, cookies can lag — accept the access token explicitly.
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!token) {
    if (error) console.error("[complete-profile] cookie auth:", error.message);
    return null;
  }

  const anon = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: byToken, error: tokenErr } = await anon.auth.getUser(token);
  if (tokenErr) {
    console.error("[complete-profile] bearer auth:", tokenErr.message);
  }
  return byToken.user ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const authOnly = await resolveAuthUser(req);
    if (!authOnly) {
      return apiError(
        "UNAUTHORIZED",
        "Not authenticated — try logging in, then finish setup",
        401,
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = completeProfileSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        "VALIDATION",
        parsed.error.issues[0]?.message ?? "Invalid",
        400,
      );
    }

    const { username, phone, bio, favoriteGenres, country } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing && existing.id !== authOnly.id) {
      return apiError("CONFLICT", "Username taken", 409);
    }

    const emailVerified = Boolean(authOnly.email_confirmed_at);
    const isGuest = authOnly.is_anonymous === true;
    const metaPhone =
      typeof authOnly.user_metadata?.phone === "string"
        ? authOnly.user_metadata.phone
        : null;
    const phoneValue = phone ?? metaPhone;
    const email = authOnly.email ?? `${authOnly.id}@guest.cinemate.local`;

    // Email unique to another auth id (leftover row) — reclaim if same email
    const emailOwner = await prisma.user.findUnique({ where: { email } });
    if (emailOwner && emailOwner.id !== authOnly.id) {
      return apiError(
        "CONFLICT",
        "This email already has a profile. Log in instead.",
        409,
      );
    }

    const appUser = await prisma.user.upsert({
      where: { id: authOnly.id },
      create: {
        id: authOnly.id,
        email,
        emailVerified,
        username,
        phone: phoneValue,
        bio: bio ?? null,
        favoriteGenres: favoriteGenres ?? [],
        country: country ?? null,
        isGuest,
      },
      update: {
        username,
        ...(phoneValue !== null &&
          phoneValue !== undefined && { phone: phoneValue }),
        bio: bio ?? null,
        favoriteGenres: favoriteGenres ?? [],
        country: country ?? null,
        emailVerified,
        isGuest,
      },
    });

    return Response.json({ user: appUser });
  } catch (err) {
    console.error("[complete-profile]", err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        const fields = (err.meta?.target as string[] | undefined)?.join(", ");
        return apiError(
          "CONFLICT",
          fields
            ? `Already taken: ${fields}. Try a different username or log in.`
            : "Username or email already taken. Log in instead.",
          409,
        );
      }
      return apiError("DB_ERROR", `Database error (${err.code})`, 500);
    }
    return apiError(
      "SERVER",
      err instanceof Error ? err.message : "Could not save profile",
      500,
    );
  }
}
