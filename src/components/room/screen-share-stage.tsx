"use client";

import { useEffect, useRef, useState } from "react";

export function ScreenShareStage({
  localSharing,
  remoteStream,
  sharerLabel,
}: {
  localSharing: boolean;
  remoteStream: MediaStream | null;
  sharerLabel: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (remoteStream) {
      el.srcObject = remoteStream;
      setBlocked(false);
      void el.play().catch(() => setBlocked(true));
    } else {
      el.srcObject = null;
    }
  }, [remoteStream]);

  async function toggleFullscreen() {
    const el = videoRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      // ignore
    }
  }

  if (!localSharing && !remoteStream) return null;

  return (
    <div className="relative flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-sm bg-ink-950 aspect-video ring-1 ring-amber-500/30">
        {remoteStream ? (
          <video
            ref={videoRef}
            className="h-full w-full object-contain bg-black"
            autoPlay
            playsInline
            controls
            controlsList="nodownload"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-cream/50">
            You are sharing your screen — others should see it now
          </div>
        )}
        <div className="absolute left-3 top-3 bg-ink-950/80 px-2 py-1 text-xs text-amber-400">
          Live from @{sharerLabel ?? "someone"}
        </div>
      </div>

      {remoteStream && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => {
              const el = videoRef.current;
              if (!el) return;
              if (el.paused) void el.play().catch(() => setBlocked(true));
              else el.pause();
            }}
            className="border border-cream/20 px-3 py-1.5 text-cream/80 hover:border-amber-500/40"
          >
            Play / Pause
          </button>
          <label className="flex items-center gap-2 text-cream/70">
            Volume
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              defaultValue={1}
              onChange={(e) => {
                if (videoRef.current) {
                  videoRef.current.volume = Number(e.target.value);
                  videoRef.current.muted = Number(e.target.value) === 0;
                }
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="border border-cream/20 px-3 py-1.5 text-cream/80 hover:border-amber-500/40"
          >
            Full screen
          </button>
          {blocked && (
            <button
              type="button"
              onClick={() => {
                setBlocked(false);
                void videoRef.current?.play().catch(() => setBlocked(true));
              }}
              className="bg-amber-500 px-3 py-1.5 font-medium text-ink-950"
            >
              Tap to unmute / play
            </button>
          )}
        </div>
      )}
    </div>
  );
}
