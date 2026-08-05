import { redirect, notFound } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { RoomView } from "@/components/room/room-view";
import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ id: string }> };

export default async function RoomPage({ params }: Props) {
  const user = await getAppUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const membership = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId: id, userId: user.id } },
  });
  if (!membership) {
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) notFound();
    redirect(`/rooms/join/${room.inviteCode}`);
  }

  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      host: { select: { id: true, username: true, avatarUrl: true } },
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              isGuest: true,
            },
          },
        },
      },
      playbackState: true,
      messages: {
        orderBy: { createdAt: "asc" },
        take: 200,
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
      },
    },
  });

  if (!room) notFound();

  const serialized = JSON.parse(JSON.stringify(room));

  return (
    <>
      <AppNav username={user.username} />
      <RoomView
        room={serialized}
        currentUser={{ id: user.id, username: user.username }}
      />
    </>
  );
}
