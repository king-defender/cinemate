"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notification-bell";

const links = [
  { href: "/dashboard", label: "Home" },
  { href: "/rooms/new", label: "Rooms" },
  { href: "/buddy", label: "Buddies" },
  { href: "/communities", label: "Communities" },
  { href: "/history", label: "History" },
];

export function AppNav({ username }: { username?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-void/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-5 md:h-[4.5rem] md:px-8">
        <div className="flex items-center gap-10">
          <Link
            href={username ? "/dashboard" : "/"}
            className="group relative font-display text-xl font-extrabold tracking-tight md:text-2xl"
          >
            <span className="text-pearl">Cine</span>
            <span className="text-ember">Mate</span>
            <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-ember transition-all duration-300 group-hover:w-full" />
          </Link>

          {username && (
            <nav className="hidden items-center gap-1 md:flex">
              {links.map((l) => {
                const active =
                  pathname === l.href || pathname.startsWith(`${l.href}/`);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-sm transition",
                      active
                        ? "bg-white/[0.06] font-semibold text-pearl"
                        : "text-mist hover:text-pearl",
                    )}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2.5 text-sm">
          {username ? (
            <>
              <NotificationBell />
              <Link
                href={`/profile/${username}`}
                className="hidden items-center gap-2 rounded-full border border-white/[0.08] bg-panel/80 py-1 pl-1 pr-3 sm:flex"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-ember to-ember-deep text-[11px] font-bold">
                  {username.slice(0, 1).toUpperCase()}
                </span>
                <span className="text-mist">@{username}</span>
              </Link>
              <Link
                href="/settings"
                className="hidden text-mist transition hover:text-pearl lg:inline"
              >
                Settings
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                className="text-mist/70 transition hover:text-pearl"
              >
                Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 text-mist hover:text-pearl">
                Log in
              </Link>
              <Link
                href="/register"
                className="btn-cinema rounded-full px-5 py-2 text-xs tracking-wide"
              >
                Join free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
