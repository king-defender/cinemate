import Link from "next/link";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { getAppUser, canHostOrBuddy } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await getAppUser();
  if (!user) redirect("/login");

  const [activeRooms, openBuddies] = await Promise.all([
    prisma.roomMember.findMany({
      where: { userId: user.id, room: { endedAt: null } },
      include: {
        room: {
          include: {
            host: { select: { username: true } },
            _count: { select: { members: true } },
          },
        },
      },
      take: 5,
    }),
    prisma.buddyRequest.count({ where: { status: "open" } }),
  ]);

  const verified = canHostOrBuddy(user);

  return (
    <>
      <AppNav username={user.username} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <p className="text-xs uppercase tracking-[0.25em] text-amber-400/80">
          Your stage
        </p>
        <h1 className="mt-2 font-display text-5xl tracking-wide text-cream">
          Hey, {user.username}
        </h1>
        <p className="mt-3 max-w-lg text-cream/55">
          Spin up a room, jump into an invite, or find a movie buddy.
        </p>

        {!verified && !user.isGuest && (
          <div className="mt-6 border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Verify your email to create rooms and send buddy requests. You can
            still join rooms via invite.
          </div>
        )}
        {user.isGuest && (
          <div className="mt-6 border border-cream/15 bg-ink-900 px-4 py-3 text-sm text-cream/60">
            You&apos;re in guest mode — join rooms via invite, or{" "}
            <Link href="/register" className="text-amber-400">
              create an account
            </Link>{" "}
            to host.
          </div>
        )}

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Link
            href="/rooms/new"
            className="group border border-cream/10 bg-ink-900/70 p-5 transition hover:border-amber-500/40"
          >
            <p className="font-display text-2xl text-amber-400">New room</p>
            <p className="mt-2 text-sm text-cream/50">
              Private invite link · synced playback · chat
            </p>
          </Link>
          <Link
            href="/buddy"
            className="border border-cream/10 bg-ink-900/70 p-5 transition hover:border-amber-500/40"
          >
            <p className="font-display text-2xl text-cream">Movie buddy</p>
            <p className="mt-2 text-sm text-cream/50">
              {openBuddies} open request{openBuddies === 1 ? "" : "s"} waiting
            </p>
          </Link>
          <Link
            href="/history"
            className="border border-cream/10 bg-ink-900/70 p-5 transition hover:border-amber-500/40"
          >
            <p className="font-display text-2xl text-cream">History</p>
            <p className="mt-2 text-sm text-cream/50">Past rooms & chat logs</p>
          </Link>
        </div>

        <section className="mt-12">
          <h2 className="font-display text-2xl tracking-wide text-cream">
            Active rooms
          </h2>
          {activeRooms.length === 0 ? (
            <p className="mt-3 text-sm text-cream/45">
              No live rooms — create one or paste an invite.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-cream/10 border border-cream/10">
              {activeRooms.map((m) => (
                <li key={m.roomId}>
                  <Link
                    href={`/rooms/${m.roomId}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-cream/5"
                  >
                    <span className="text-cream">
                      {m.room.title ?? "Watch session"}
                      <span className="ml-2 text-cream/40">
                        · @{m.room.host.username}
                      </span>
                    </span>
                    <span className="text-xs text-cream/40">
                      {m.room._count.members} watching
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <form
            action="/rooms/join"
            className="mt-6 flex flex-wrap gap-2"
          >
            {/* client join handled on /rooms/join/[code] */}
          </form>
          <JoinCodeField />
        </section>
      </main>
    </>
  );
}

function JoinCodeField() {
  return (
    <form
      className="mt-4 flex max-w-md gap-2"
      action={async (fd) => {
        "use server";
        const code = String(fd.get("code") ?? "")
          .trim()
          .toUpperCase();
        if (code) redirect(`/rooms/join/${code}`);
      }}
    >
      <input
        name="code"
        placeholder="Invite code"
        className="flex-1 border border-cream/15 bg-ink-900 px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:border-amber-500/50 focus:outline-none"
      />
      <button
        type="submit"
        className="bg-cream/10 px-4 py-2 text-sm text-cream hover:bg-cream/15"
      >
        Join
      </button>
    </form>
  );
}
