import { prisma } from "@/lib/prisma";
import type { User as AuthUser } from "@supabase/supabase-js";

function fallbackUsername(authUser: AuthUser) {
  const meta = authUser.user_metadata?.username;
  if (typeof meta === "string" && meta.length >= 3) return meta;
  const base = (authUser.email?.split("@")[0] ?? "user")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .slice(0, 16);
  return `${base || "user"}_${authUser.id.slice(0, 6)}`;
}

/** Creates the app User row from a Supabase auth user if missing. */
export async function ensureAppUser(authUser: AuthUser) {
  const existing = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (existing) {
    const emailVerified = Boolean(authUser.email_confirmed_at);
    if (existing.emailVerified !== emailVerified) {
      return prisma.user.update({
        where: { id: authUser.id },
        data: { emailVerified },
      });
    }
    return existing;
  }

  let username = fallbackUsername(authUser);
  const taken = await prisma.user.findUnique({ where: { username } });
  if (taken) {
    username = `${username.slice(0, 18)}_${authUser.id.slice(0, 4)}`;
  }

  return prisma.user.create({
    data: {
      id: authUser.id,
      email: authUser.email ?? `${authUser.id}@guest.cinemate.local`,
      emailVerified: Boolean(authUser.email_confirmed_at),
      username,
      isGuest: authUser.is_anonymous === true,
    },
  });
}
