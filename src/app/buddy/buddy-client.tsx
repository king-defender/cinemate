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
      <main className="mx-auto max-w-3xl flex-1 px-4 py-12">
        <h1 className="font-display text-4xl tracking-wide text-cream">
          Movie buddy
        </h1>
        <p className="mt-2 text-cream/55">
          Post a request or pick someone looking for a watch partner.
        </p>

        <form onSubmit={createRequest} className="mt-8 flex flex-wrap gap-2">
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags: horror, evenings, anime…"
            className="min-w-[200px] flex-1 border border-cream/15 bg-ink-900 px-3 py-2 text-sm text-cream focus:border-amber-500/50 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-amber-500 px-4 py-2 text-sm font-medium text-ink-950 hover:bg-amber-400"
          >
            Post request
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-300">{error}</p>}

        {mine.filter((m) => m.status === "open").length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-2xl text-cream">Your open request</h2>
            <ul className="mt-3 space-y-2">
              {mine
                .filter((m) => m.status === "open")
                .map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between border border-cream/10 bg-ink-900/60 px-4 py-3"
                  >
                    <span className="text-sm text-cream/70">
                      {m.tags.length ? m.tags.join(" · ") : "No tags"}
                    </span>
                    <button
                      type="button"
                      onClick={() => cancel(m.id)}
                      className="text-xs text-cream/40 hover:text-red-300"
                    >
                      Cancel
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        )}

        <section className="mt-10">
          <h2 className="font-display text-2xl text-cream">Browse requests</h2>
          {open.length === 0 ? (
            <p className="mt-3 text-sm text-cream/45">No open requests right now.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {open.map((r) => (
                <li
                  key={r.id}
                  className="border border-cream/10 bg-ink-900/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-cream">
                        @{r.requester.username}
                      </p>
                      {r.requester.bio && (
                        <p className="mt-1 text-sm text-cream/50">
                          {r.requester.bio}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-amber-400/80">
                        {r.tags.join(" · ") || "Open to anything"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => select(r.id)}
                      className="shrink-0 bg-amber-500 px-3 py-1.5 text-sm font-medium text-ink-950 hover:bg-amber-400"
                    >
                      Match
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
