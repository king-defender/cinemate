import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { AppNav } from "@/components/app-nav";
import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function HistoryPage() {
  const user = await getAppUser();
  if (!user) redirect("/login");

  const memberships = await prisma.roomMember.findMany({
    where: {
      userId: user.id,
      room: { endedAt: { not: null } },
    },
    include: {
      room: {
        include: {
          host: { select: { username: true } },
          members: {
            include: { user: { select: { username: true } } },
          },
          _count: { select: { messages: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
    take: 50,
  });

  return (
    <>
      <AppNav username={user.username} />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-12">
        <h1 className="font-display text-4xl tracking-wide text-cream">
          Watch history
        </h1>
        <p className="mt-2 text-cream/55">Private to you · includes chat logs.</p>

        {memberships.length === 0 ? (
          <p className="mt-8 text-sm text-cream/45">
            No finished rooms yet. End a session to see it here.
          </p>
        ) : (
          <ul className="mt-8 divide-y divide-cream/10 border border-cream/10">
            {memberships.map((m) => {
              const started = m.room.createdAt.getTime();
              const ended = m.room.endedAt?.getTime() ?? started;
              const mins = Math.max(1, Math.round((ended - started) / 60000));
              return (
                <li key={m.roomId} className="px-4 py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Link
                      href={`/rooms/${m.roomId}`}
                      className="font-medium text-cream hover:text-amber-400"
                    >
                      {m.room.title ?? "Watch session"}
                    </Link>
                    <span className="text-xs text-cream/40">
                      {m.room.endedAt
                        ? formatDistanceToNow(m.room.endedAt, { addSuffix: true })
                        : ""}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-cream/50">
                    Host @{m.room.host.username} · {mins} min ·{" "}
                    {m.room._count.messages} messages ·{" "}
                    {m.room.members.map((x) => x.user.username).join(", ")}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
