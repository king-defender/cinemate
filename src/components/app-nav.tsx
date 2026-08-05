"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notification-bell";

const links = [
  { href: "/dashboard", label: "Home" },
  { href: "/rooms/new", label: "New room" },
  { href: "/buddy", label: "Buddy" },
  { href: "/history", label: "History" },
  { href: "/communities", label: "Communities" },
  { href: "/settings", label: "Settings" },
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
    <header className="sticky top-0 z-40 border-b border-cream/10 bg-ink-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href={username ? "/dashboard" : "/"}
          className="font-display text-2xl tracking-[0.08em] text-amber-400"
        >
          CineMate
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "px-3 py-1.5 text-sm transition",
                pathname === l.href || pathname.startsWith(l.href + "/")
                  ? "text-amber-400"
                  : "text-cream/60 hover:text-cream",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          {username ? (
            <>
              <NotificationBell />
              <Link
                href={`/profile/${username}`}
                className="text-cream/70 hover:text-cream"
              >
                @{username}
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="text-cream/40 hover:text-cream"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-cream/70 hover:text-cream">
                Log in
              </Link>
              <Link
                href="/register"
                className="bg-amber-500 px-3 py-1.5 font-medium text-ink-950 hover:bg-amber-400"
              >
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
