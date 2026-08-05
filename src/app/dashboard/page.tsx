import Link from "next/link";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { getAppUser, canHostOrBuddy } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await getAppUser();
  if (!user) redirect("/login");

  const [activeRooms, openBuddies, recentBuddy] = await Promise.all([
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
      take: 8,
    }),
    prisma.buddyRequest.count({ where: { status: "open" } }),
    prisma.buddyRequest.findMany({
      where: { status: "open", requesterId: { not: user.id } },
      include: {
        requester: {
          select: { username: true, bio: true, favoriteGenres: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const verified = canHostOrBuddy(user);
  const featured = activeRooms[0];

  return (
    <>
      <AppNav username={user.username} />
      <main className="relative mx-auto w-full max-w-[1200px] flex-1 px-5 py-10 md:px-8">
        {/* Welcome band */}
        <section className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-gradient-to-br from-panel via-stage to-void p-8 md:p-10">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-ember/20 blur-3xl" />
          <div className="absolute bottom-0 right-10 hidden h-40 w-64 seat-rows opacity-40 md:block" />
          <div className="relative z-10 max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-mint">
              Tonight&apos;s stage
            </p>
            <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
              Welcome back, {user.username}
            </h1>
            <p className="mt-3 text-mist">
              {openBuddies > 0
                ? `${openBuddies} buddy request${openBuddies === 1 ? "" : "s"} waiting · pick a room or start fresh.`
                : "Start a room, drop an invite, or find someone to watch with."}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/rooms/new"
                className="btn-cinema inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm"
              >
                <span aria-hidden>▶</span> Host a room
              </Link>
              <Link
                href="/buddy"
                className="btn-glass rounded-full px-6 py-3 text-sm"
              >
                Find a buddy
              </Link>
            </div>
          </div>
        </section>

        {!verified && !user.isGuest && (
          <div className="glass-card mt-5 rounded-2xl border-ember/25 px-4 py-3 text-sm text-[#ffb4aa]">
            Verify your email to host rooms and post buddy requests.
          </div>
        )}
        {user.isGuest && (
          <div className="glass-card mt-5 rounded-2xl px-4 py-3 text-sm text-mist">
            Guest mode — join via invite, or{" "}
            <Link href="/register" className="text-ember hover:underline">
              create an account
            </Link>{" "}
            to host.
          </div>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_0.85fr]">
          {/* Main column */}
          <div className="space-y-10">
            <section>
              <div className="mb-4 flex items-end justify-between gap-3">
                <h2 className="font-display text-2xl font-bold tracking-tight">
                  Your rooms
                </h2>
                <Link
                  href="/history"
                  className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ember hover:underline"
                >
                  History
                </Link>
              </div>

              {activeRooms.length === 0 ? (
                <div className="glass-card rounded-[1.5rem] px-6 py-12 text-center">
                  <p className="font-display text-xl font-bold">No live rooms yet</p>
                  <p className="mt-2 text-sm text-mist">
                    Host one, or paste an invite code below.
                  </p>
                  <Link
                    href="/rooms/new"
                    className="btn-cinema mt-6 inline-flex rounded-full px-6 py-2.5 text-sm"
                  >
                    Create room
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {featured && (
                    <Link
                      href={`/rooms/${featured.roomId}`}
                      className="group relative block overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-panel"
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(255,45,59,0.28),transparent_50%),linear-gradient(180deg,transparent_30%,rgba(7,9,15,0.92))]" />
                      <div className="relative flex min-h-[200px] flex-col justify-end p-6 md:min-h-[240px]">
                        <span className="mb-3 w-fit rounded-full bg-ember/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                          {featured.room.host.username === user.username
                            ? "Your room"
                            : `Hosted by @${featured.room.host.username}`}
                        </span>
                        <h3 className="font-display text-3xl font-bold tracking-tight transition group-hover:text-ember">
                          {featured.room.title ?? "Watch session"}
                        </h3>
                        <p className="mt-2 text-sm text-mist">
                          {featured.room._count.members} watching · tap to rejoin
                        </p>
                      </div>
                    </Link>
                  )}

                  {activeRooms.length > 1 && (
                    <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
                      {activeRooms.slice(1).map((m) => (
                        <Link
                          key={m.roomId}
                          href={`/rooms/${m.roomId}`}
                          className="glass-card group w-64 shrink-0 overflow-hidden rounded-2xl transition hover:-translate-y-1"
                        >
                          <div className="h-28 bg-gradient-to-br from-panel-lift to-void transition duration-500 group-hover:scale-[1.03]" />
                          <div className="p-4">
                            <h3 className="truncate font-semibold">
                              {m.room.title ?? "Watch session"}
                            </h3>
                            <p className="mt-1 text-xs text-mist">
                              @{m.room.host.username} · {m.room._count.members}{" "}
                              live
                            </p>
                            <span className="mt-3 inline-block text-xs font-semibold text-ember">
                              Rejoin →
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <JoinCodeField />
            </section>

            {recentBuddy.length > 0 && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-2xl font-bold tracking-tight">
                    Live buddy requests
                  </h2>
                  <span className="rounded-full bg-mint/15 px-3 py-1 text-[11px] font-bold text-mint">
                    {openBuddies} open
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {recentBuddy.map((r) => (
                    <Link
                      key={r.id}
                      href="/buddy"
                      className="glass-card flex gap-3 rounded-2xl border-l-4 border-l-mint p-4 transition hover:bg-white/[0.03]"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-mint/30 to-panel font-bold text-mint">
                        {r.requester.username.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold">@{r.requester.username}</p>
                        <p className="mt-1 line-clamp-1 text-xs text-mist">
                          {r.tags.join(" · ") ||
                            r.requester.bio ||
                            "Open to anything"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Side rail */}
          <aside className="space-y-5">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-mist/70">
                Quick actions
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/rooms/new"
                  className="glass-card group flex flex-col items-center gap-3 rounded-2xl p-5 text-center transition hover:border-ember/35"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ember/20 text-ember transition group-hover:scale-110">
                    ◉
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Host
                  </span>
                </Link>
                <Link
                  href="/buddy"
                  className="glass-card group flex flex-col items-center gap-3 rounded-2xl p-5 text-center transition hover:border-mint/35"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-mint/15 text-mint transition group-hover:scale-110">
                    ✦
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Buddy
                  </span>
                </Link>
              </div>
            </div>

            <div className="glass-card rounded-[1.5rem] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-mist/70">
                Jump in
              </p>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <Link href="/communities" className="text-pearl hover:text-ember">
                    Genre communities →
                  </Link>
                </li>
                <li>
                  <Link href="/history" className="text-pearl hover:text-ember">
                    Watch history →
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/profile/${user.username}`}
                    className="text-pearl hover:text-ember"
                  >
                    Your profile →
                  </Link>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

function JoinCodeField() {
  return (
    <form
      className="glass-card mt-6 flex max-w-md items-center gap-2 rounded-2xl p-2"
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
        placeholder="Paste invite code"
        className="flex-1 rounded-xl border-0 bg-transparent px-3 py-2.5 text-sm text-pearl placeholder:text-mist/50 focus:outline-none"
      />
      <button type="submit" className="btn-cinema rounded-xl px-5 py-2.5 text-sm">
        Join
      </button>
    </form>
  );
}
