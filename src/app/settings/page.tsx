import { redirect } from "next/navigation";
import { getAppUser } from "@/lib/auth";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const user = await getAppUser();
  if (!user) redirect("/login");
  if (user.isGuest) redirect("/dashboard");

  return (
    <SettingsClient
      user={{
        username: user.username,
        phone: user.phone,
        bio: user.bio,
        favoriteGenres: user.favoriteGenres,
        country: user.country,
      }}
    />
  );
}
