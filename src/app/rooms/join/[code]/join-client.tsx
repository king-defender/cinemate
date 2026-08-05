"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/app-nav";

type Phase = "loading" | "ready" | "pending" | "denied" | "error";

export function JoinRoomClient({
  code,
  username,
}: {
  code: string;
  username: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    id: string;
    title: string | null;
    host: { username: string };
    memberCount: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/rooms/invite/${code}`);
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error?.message ?? "Invalid invite");
        setPhase("error");
        return;
      }
      setPreview(body);

      // Already a member? Go straight in
      const statusRes = await fetch(`/api/rooms/${body.id}/join`);
      const statusBody = await statusRes.json().catch(() => null);
      if (statusRes.ok && statusBody?.status === "approved") {
        router.replace(`/rooms/${body.id}`);
        return;
      }
      if (statusRes.ok && statusBody?.status === "pending") {
        setPhase("pending");
        return;
      }
      if (statusRes.ok && statusBody?.status === "denied") {
        setPhase("denied");
        return;
      }
      setPhase("ready");
    })();
  }, [code, router]);

  useEffect(() => {
    if (phase !== "pending" || !preview) return;
    const id = window.setInterval(() => {
      void (async () => {
        const res = await fetch(`/api/rooms/${preview.id}/join`);
        const body = await res.json().catch(() => null);
        if (!res.ok) return;
        if (body.status === "approved") {
          router.push(`/rooms/${preview.id}`);
        } else if (body.status === "denied") {
          setPhase("denied");
        }
      })();
    }, 2500);
    return () => window.clearInterval(id);
  }, [phase, preview, router]);

  async function requestJoin() {
    if (!preview) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/rooms/${preview.id}/join`, { method: "POST" });
    const body = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) {
      setError(body?.error?.message ?? "Could not request to join");
      setPhase("error");
      return;
    }
    if (body.status === "approved") {
      router.push(`/rooms/${preview.id}`);
      return;
    }
    setPhase("pending");
  }

  return (
    <>
      <AppNav username={username} />
      <main className="mx-auto max-w-md flex-1 px-4 py-16 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-400/80">
          Invite
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-wide text-cream">
          Join room
        </h1>
        {error && <p className="mt-6 text-red-300">{error}</p>}

        {preview && phase !== "error" && (
          <div className="mt-8 space-y-4 border border-cream/10 bg-ink-900/70 p-6">
            <p className="font-display text-2xl text-cream">
              {preview.title ?? "Watch session"}
            </p>
            <p className="text-sm text-cream/50">
              Hosted by @{preview.host.username} · {preview.memberCount}{" "}
              watching
            </p>

            {phase === "loading" && (
              <p className="text-sm text-cream/45">Checking invite…</p>
            )}

            {phase === "ready" && (
              <>
                <p className="text-sm text-cream/60">
                  The host will see your profile and must accept before you can
                  enter.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void requestJoin()}
                  className="w-full bg-amber-500 py-2.5 font-medium text-ink-950 hover:bg-amber-400 disabled:opacity-60"
                >
                  {busy ? "Sending…" : "Ask to join"}
                </button>
              </>
            )}

            {phase === "pending" && (
              <div className="space-y-3">
                <p className="text-amber-300">Waiting for host approval…</p>
                <p className="text-sm text-cream/50">
                  Stay on this page — you&apos;ll enter automatically when
                  @{preview.host.username} accepts.
                </p>
                <div className="mx-auto h-1.5 w-32 overflow-hidden rounded-full bg-cream/10">
                  <div className="h-full w-1/2 animate-pulse bg-amber-500" />
                </div>
              </div>
            )}

            {phase === "denied" && (
              <div className="space-y-3">
                <p className="text-red-300">Host declined your request</p>
                <p className="text-sm text-cream/50">
                  You can ask again, or go back to the dashboard.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void requestJoin()}
                  className="w-full border border-cream/20 py-2.5 text-cream hover:border-amber-500/40"
                >
                  Ask again
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
