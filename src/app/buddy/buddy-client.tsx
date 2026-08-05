"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/app-nav";

type OpenRequest = {
  id: string;
  tags: string[];
  createdAt: string;
  requester: {
    id: string;
    username: string;
    avatarUrl: string | null;
    bio: string | null;
    favoriteGenres: string[];
  };
};

type Mine = {
  id: string;
  tags: string[];
  status: string;
  createdAt: string;
  matchedRoomId: string | null;
};

export function BuddyClient({ username }: { username: string }) {
  const router = useRouter();
  const [open, setOpen] = useState<OpenRequest[]>([]);
  const [mine, setMine] = useState<Mine[]>([]);
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/buddy/requests");
    const body = await res.json();
    if (res.ok) {
      setOpen(body.open);
      setMine(body.mine);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createRequest(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/buddy/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setError(body?.error?.message ?? "Failed");
      return;
    }
    setTags("");
    await load();
  }

  async function cancel(id: string) {
    await fetch(`/api/buddy/requests/${id}`, { method: "DELETE" });
    await load();
  }

  async function select(id: string) {
    const res = await fetch(`/api/buddy/requests/${id}/select`, {
      method: "POST",
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setError(body?.error?.message ?? "Match failed");
      return;
    }
    router.push(`/rooms/${body.roomId}`);
  }

  return (
    <>
      <AppNav username={username} />
      <main className="relative mx-auto w-full max-w-[1100px] flex-1 px-5 py-10 md:px-8">
        <div
          className="ambient-orb left-[-5%] top-0 h-64 w-64 bg-mint/15"
          aria-hidden
        />

        <header className="relative max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-mint">
            Find your seatmate
          </p>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
            Looking for someone
            <br />
            <span className="text-mist">to watch with?</span>
          </h1>
          <p className="mt-4 max-w-lg text-mist">
            Drop what you&apos;re craving — genre, vibe, time. Match, open a
            room, and the night starts.
          </p>
        </header>

        <form
          onSubmit={createRequest}
          className="glass-card relative mt-10 flex flex-col gap-3 rounded-[1.5rem] p-3 sm:flex-row sm:items-center"
        >
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="horror · rainy nights · anime · first watch…"
            className="min-w-0 flex-1 rounded-xl border-0 bg-transparent px-4 py-3 text-sm text-pearl placeholder:text-mist/50 focus:outline-none"
          />
          <button
            type="submit"
            className="btn-cinema shrink-0 rounded-full px-6 py-3 text-sm"
          >
            Post request
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-[#ffb4aa]">{error}</p>}

        {mine.filter((m) => m.status === "open").length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-xl font-bold tracking-tight">
              Your signal is live
            </h2>
            <ul className="mt-4 space-y-2">
              {mine
                .filter((m) => m.status === "open")
                .map((m) => (
                  <li
                    key={m.id}
                    className="glass-card flex items-center justify-between gap-3 rounded-2xl border-l-4 border-l-ember px-4 py-3"
                  >
                    <span className="text-sm text-mist">
                      {m.tags.length ? m.tags.join(" · ") : "Open to anything"}
                    </span>
                    <button
                      type="button"
                      onClick={() => void cancel(m.id)}
                      className="text-xs text-mist transition hover:text-[#ffb4aa]"
                    >
                      Cancel
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        )}

        <section className="mt-14">
          <div className="mb-5 flex items-end justify-between gap-3">
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Open seats
            </h2>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mist">
              {open.length} waiting
            </span>
          </div>

          {open.length === 0 ? (
            <div className="glass-card rounded-[1.5rem] px-6 py-14 text-center">
              <p className="font-display text-xl font-bold">Quiet lobby</p>
              <p className="mt-2 text-sm text-mist">
                Be the first — post a request above.
              </p>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {open.map((r, i) => (
                <li
                  key={r.id}
                  className="group relative overflow-hidden rounded-[1.35rem] border border-white/[0.07] bg-panel/80 transition hover:-translate-y-1 hover:border-mint/30"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-mint via-mint/40 to-transparent opacity-80" />
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-mint/25 to-panel-lift font-display text-lg font-bold text-mint">
                        {r.requester.username.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">@{r.requester.username}</p>
                        {r.requester.bio && (
                          <p className="mt-1 line-clamp-2 text-sm text-mist">
                            {r.requester.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {(r.tags.length
                        ? r.tags
                        : ["Open to anything"]
                      ).map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-mint/10 px-2.5 py-0.5 text-[11px] font-medium text-mint"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => void select(r.id)}
                      className="btn-cinema mt-5 w-full rounded-full py-2.5 text-sm"
                    >
                      Match & open room
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
