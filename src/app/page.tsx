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
      <main className="relative flex flex-1 flex-col">
        <section className="relative flex min-h-[calc(100vh-3.5rem)] flex-col justify-end overflow-hidden px-6 pb-16 pt-24 md:px-12 md:pb-24">
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(212,160,23,0.18),transparent_50%),radial-gradient(ellipse_at_10%_80%,rgba(243,235,224,0.06),transparent_40%),linear-gradient(180deg,#0c0b0a_0%,#161412_55%,#0c0b0a_100%)]"
            aria-hidden
          />
          <div
            className="animate-glow absolute -right-20 top-10 h-[420px] w-[420px] rounded-full bg-amber-500/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, #f3ebe0 2px, #f3ebe0 3px)",
            }}
            aria-hidden
          />

          <div className="relative z-10 mx-auto w-full max-w-5xl">
            <p className="animate-fade-up font-display text-6xl leading-none tracking-[0.12em] text-amber-400 sm:text-8xl md:text-9xl">
              CineMate
            </p>
            <h1 className="animate-fade-up-delay mt-4 max-w-xl font-display text-3xl tracking-wide text-cream sm:text-4xl">
              Watch together, no matter where you are.
            </h1>
            <p className="animate-fade-up-delay mt-4 max-w-md text-base leading-relaxed text-cream/60 sm:text-lg">
              Create a room, sync playback with friends, chat live, and build a
              history of everything you&apos;ve watched together.
            </p>
            <div className="animate-fade-up-delay mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="bg-amber-500 px-6 py-3 text-sm font-semibold text-ink-950 transition hover:bg-amber-400"
              >
                Start watching
              </Link>
              <Link
                href="/login"
                className="border border-cream/25 px-6 py-3 text-sm text-cream/80 transition hover:border-cream/50 hover:text-cream"
              >
                Log in
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
