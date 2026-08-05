import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ensureAppUser } from "@/lib/ensure-app-user";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Deduped per request — pages/layouts that call this multiple times share one result. */
export const getAppUser = cache(async () => {
  const authUser = await getSessionUser();
  if (!authUser) return null;

  try {
    let appUser = await prisma.user.findUnique({
      where: { id: authUser.id },
    });

    if (!appUser) {
      appUser = await ensureAppUser(authUser);
    }

    return {
      ...appUser,
      authEmailVerified: Boolean(authUser.email_confirmed_at),
    };
  } catch (err) {
    // Missing/unreachable DATABASE_URL on Vercel otherwise 500s the whole page
    console.error("[getAppUser] database error:", err);
    throw new Error(
      "Database unavailable. Check DATABASE_URL / DIRECT_URL on Vercel (use Supabase pooler).",
    );
  }
});

export function canHostOrBuddy(user: {
  isGuest: boolean;
  emailVerified: boolean;
  authEmailVerified?: boolean;
}) {
  if (user.isGuest) return false;
  return user.emailVerified || Boolean(user.authEmailVerified);
}
