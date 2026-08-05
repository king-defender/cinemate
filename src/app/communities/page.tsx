import { redirect } from "next/navigation";
import { getAppUser } from "@/lib/auth";
import { CommunitiesClient } from "./communities-client";

export default async function CommunitiesPage() {
  const user = await getAppUser();
  if (!user) redirect("/login");
  return <CommunitiesClient username={user.username} />;
}
