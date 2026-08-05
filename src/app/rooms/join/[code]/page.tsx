import { redirect } from "next/navigation";
import { getAppUser } from "@/lib/auth";
import { JoinRoomClient } from "./join-client";

type Props = { params: Promise<{ code: string }> };

export default async function JoinPage({ params }: Props) {
  const user = await getAppUser();
  if (!user) {
    const { code } = await params;
    redirect(`/login?next=${encodeURIComponent(`/rooms/join/${code}`)}`);
  }
  const { code } = await params;
  return <JoinRoomClient code={code.toUpperCase()} username={user.username} />;
}
