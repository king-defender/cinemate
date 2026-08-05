import { redirect } from "next/navigation";
import { getAppUser, canHostOrBuddy } from "@/lib/auth";
import { CreateRoomClient } from "./create-room-client";

export default async function NewRoomPage() {
  const user = await getAppUser();
  if (!user) redirect("/login");
  if (!canHostOrBuddy(user)) {
    redirect("/dashboard");
  }
  return <CreateRoomClient username={user.username} />;
}
