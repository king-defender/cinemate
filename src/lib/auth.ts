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
});

export function canHostOrBuddy(user: {
  isGuest: boolean;
  emailVerified: boolean;
  authEmailVerified?: boolean;
}) {
  if (user.isGuest) return false;
  return user.emailVerified || Boolean(user.authEmailVerified);
}
