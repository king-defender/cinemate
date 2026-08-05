"use client";

import { useEffect, useState } from "react";
import { AppNav } from "@/components/app-nav";

type Community = {
  id: string;
  name: string;
  genre: string;
  memberCount: number;
  joined: boolean;
};

export function CommunitiesClient({ username }: { username: string }) {
  const [communities, setCommunities] = useState<Community[]>([]);

  async function load() {
    const res = await fetch("/api/communities");
    const body = await res.json();
    if (res.ok) setCommunities(body.communities);
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggle(id: string, joined: boolean) {
    await fetch("/api/communities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        communityId: id,
        action: joined ? "leave" : "join",
      }),
    });
    await load();
  }

  return (
    <>
      <AppNav username={username} />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-12">
        <h1 className="font-display text-4xl tracking-wide text-cream">
          Communities
        </h1>
        <p className="mt-2 text-cream/55">
          Genre groups — join instantly, no approval needed.
        </p>
        <ul className="mt-8 space-y-3">
          {communities.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between border border-cream/10 bg-ink-900/60 px-4 py-4"
            >
              <div>
                <p className="font-medium text-cream">{c.name}</p>
                <p className="text-sm text-cream/45">
                  {c.genre} · {c.memberCount} members
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggle(c.id, c.joined)}
                className={
                  c.joined
                    ? "border border-cream/20 px-3 py-1.5 text-sm text-cream/70"
                    : "bg-amber-500 px-3 py-1.5 text-sm font-medium text-ink-950"
                }
              >
                {c.joined ? "Leave" : "Join"}
              </button>
            </li>
          ))}
          {communities.length === 0 && (
            <p className="text-sm text-cream/45">
              No communities yet — run the seed script after migrating.
            </p>
          )}
        </ul>
      </main>
    </>
  );
}
