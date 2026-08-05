import { redirect } from "next/navigation";
import { getAppUser, canHostOrBuddy } from "@/lib/auth";
import { BuddyClient } from "./buddy-client";

export default async function BuddyPage() {
  const user = await getAppUser();
  if (!user) redirect("/login");
  if (user.isGuest) redirect("/dashboard");
  if (!canHostOrBuddy(user)) {
    // still allow browsing but posting will 403
  }
  return <BuddyClient username={user.username} />;
}
