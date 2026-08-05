import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppUser } from "@/lib/auth";
import { AppNav } from "@/components/app-nav";

export default async function HomePage() {
  const user = await getAppUser();
  if (user) redirect("/dashboard");

  return (
    <>
      <AppNav />
      <main className="relative flex flex-1 flex-col overflow-x-hidden">
        {/* Asymmetric hero — brand as stage left, story as stage right */}
        <section className="relative mx-auto grid min-h-[calc(100vh-4.5rem)] w-full max-w-[1200px] items-center gap-12 px-5 py-16 md:grid-cols-[1.05fr_0.95fr] md:px-8 md:py-20">
          <div
            className="ambient-orb animate-glow left-[-10%] top-[10%] h-[380px] w-[380px] bg-ember/25"
            aria-hidden
          />
          <div
            className="ambient-orb right-[5%] bottom-[15%] h-[280px] w-[280px] bg-mint/10"
            aria-hidden
          />

          <div className="relative z-10">
            <p className="animate-fade-up text-[11px] font-semibold uppercase tracking-[0.35em] text-mint">
              Private theaters · live sync
            </p>
            <h1 className="animate-fade-up-delay mt-5 font-display text-[clamp(2.8rem,7vw,5.2rem)] font-extrabold leading-[0.95] tracking-tight">
              Your couch.
              <br />
              <span className="bg-gradient-to-r from-ember via-[#ff7a82] to-pearl bg-clip-text text-transparent">
                Their city.
              </span>
              <br />
              One screen.
            </h1>
            <p className="animate-fade-up-delay mt-6 max-w-md text-base leading-relaxed text-mist md:text-lg">
              CineMate is a tiny private cinema for friends — synced playback,
              live chat, host approval, and movie buddies when you need someone
              new to watch with.
            </p>
            <div className="animate-fade-up-delay-2 mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="btn-cinema rounded-full px-8 py-3.5 text-sm"
              >
                Open your theater
              </Link>
              <Link
                href="/login"
                className="btn-glass rounded-full px-7 py-3.5 text-sm"
              >
                I have an invite
              </Link>
            </div>
            <div className="animate-fade-up-delay-2 mt-10 flex items-center gap-4 text-xs text-mist">
              <div className="flex -space-x-2">
                {["A", "R", "K", "+"].map((c) => (
                  <span
                    key={c}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-void bg-panel text-[10px] font-bold"
                  >
                    {c}
                  </span>
                ))}
              </div>
              <p>
                Built for nights that feel shared — even when the rooms are
                continents apart.
              </p>
            </div>
          </div>

          {/* Creative visual: floating theater screen */}
          <div className="relative z-10 animate-curtain">
            <div className="absolute -inset-6 rounded-[2rem] bg-ember/10 blur-3xl" />
            <div className="animate-float relative overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-stage shadow-[0_40px_100px_rgba(0,0,0,0.55)]">
              <div className="seat-rows absolute inset-0 opacity-60" />
              <div className="relative aspect-[4/5] p-5 sm:aspect-[5/6] sm:p-6">
                <div className="flex h-full flex-col">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-pearl">
                      <span className="h-1.5 w-1.5 rounded-full bg-ember sync-pulse" />
                      Live sync
                    </span>
                    <span className="text-[10px] font-medium text-mint">
                      3 watching
                    </span>
                  </div>
                  <div className="relative flex-1 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a2235] via-[#121722] to-void">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,45,59,0.35),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(61,255,168,0.12),transparent_40%)]" />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-void to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="mb-3 h-1 overflow-hidden rounded-full bg-white/15">
                        <div className="h-full w-[62%] rounded-full bg-ember" />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-pearl/80">
                        <span>01:14:22</span>
                        <span className="rounded-md bg-white/10 px-2 py-0.5">
                          1.0×
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="ml-0 max-w-[85%] rounded-2xl rounded-tl-md bg-panel-lift/90 px-3 py-2 text-xs text-pearl/90">
                      That twist was unreal —
                    </div>
                    <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-md bg-mint/15 px-3 py-2 text-right text-xs text-pearl">
                      Rewinding 10s. Hold on!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Story strips — one job each */}
        <section className="border-y border-white/[0.05] bg-stage/50 py-20">
          <div className="mx-auto grid max-w-[1200px] gap-10 px-5 md:grid-cols-3 md:px-8">
            {[
              {
                kicker: "Sync",
                title: "Same second, every seat",
                body: "Play, pause, and seek travel with the host — so reactions land together.",
              },
              {
                kicker: "Trust",
                title: "You approve the door",
                body: "Invite links still need your yes. See who’s knocking before they enter.",
              },
              {
                kicker: "Find",
                title: "Buddies when you need them",
                body: "Post what you want to watch. Match. Open a room. No awkward setup.",
              },
            ].map((f, i) => (
              <article
                key={f.kicker}
                className="group relative pl-5"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="absolute bottom-0 left-0 top-0 w-[2px] bg-gradient-to-b from-ember via-ember/40 to-transparent transition group-hover:from-mint" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-ember">
                  {f.kicker}
                </p>
                <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">
                  {f.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-mist">{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="relative mx-auto flex w-full max-w-[1200px] flex-col items-start gap-8 px-5 py-24 md:flex-row md:items-end md:justify-between md:px-8">
          <div>
            <h2 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
              Dim the lights.
              <br />
              Pass the link.
            </h2>
            <p className="mt-4 max-w-md text-mist">
              Free to start. Built for small rooms that feel big.
            </p>
          </div>
          <Link
            href="/register"
            className="btn-cinema rounded-full px-10 py-4 text-sm shadow-[0_20px_60px_rgba(255,45,59,0.25)]"
          >
            Create account
          </Link>
        </section>

        <footer className="border-t border-white/[0.05] py-8">
          <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 text-xs text-mist/70 md:px-8">
            <span className="font-display font-bold tracking-wide text-mist">
              CINEMATE
            </span>
            <span>Beta · watch together</span>
          </div>
        </footer>
      </main>
    </>
  );
}
