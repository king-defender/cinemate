import { notFound } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ username: string }> };

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const me = await getAppUser();

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      badges: {
        include: { badge: true },
        orderBy: { awardedAt: "desc" },
      },
    },
  });

  if (!user || user.isGuest) notFound();

  return (
    <>
      <AppNav username={me?.username} />
      <main className="mx-auto max-w-2xl flex-1 px-4 py-12">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-400/80">
          Profile
        </p>
        <h1 className="mt-2 font-display text-5xl tracking-wide text-cream">
          @{user.username}
        </h1>
        {user.bio && (
          <p className="mt-4 text-lg leading-relaxed text-cream/65">{user.bio}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-cream/45">
          {user.country && <span>{user.country}</span>}
          {user.favoriteGenres.length > 0 && (
            <span>{user.favoriteGenres.join(" · ")}</span>
          )}
        </div>

        <section className="mt-10">
          <h2 className="font-display text-2xl text-cream">Badges</h2>
          {user.badges.length === 0 ? (
            <p className="mt-3 text-sm text-cream/45">No badges yet.</p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {user.badges.map((b) => (
                <li
                  key={b.badgeId}
                  className="border border-amber-500/20 bg-amber-500/5 px-4 py-3"
                >
                  <p className="font-medium text-amber-400">{b.badge.name}</p>
                  <p className="mt-1 text-xs text-cream/50">
                    {b.badge.description}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
