"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "cinemate-beta-notice-dismissed";

export function BetaNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      // ignore
    }

    const timer = window.setTimeout(() => setOpen(true), 5000);
    return () => window.clearTimeout(timer);
  }, []);

  function dismiss() {
    setOpen(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-void/75 px-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="beta-notice-title"
    >
      <div className="glass-card relative w-full max-w-md overflow-hidden rounded-[1.5rem] p-7 shadow-[0_40px_100px_rgba(0,0,0,0.6)] animate-fade-up">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-ember/20 blur-3xl" />
        <p className="relative text-[11px] font-semibold uppercase tracking-[0.3em] text-ember">
          Soft opening
        </p>
        <h2
          id="beta-notice-title"
          className="relative mt-3 font-display text-3xl font-extrabold tracking-tight"
        >
          Still building the theater
        </h2>
        <p className="relative mt-3 text-sm leading-relaxed text-mist">
          You&apos;re on an early beta. Features may shift while we ship —
          thanks for watching with us.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="btn-cinema relative mt-7 w-full rounded-full py-3"
        >
          Got it — continue
        </button>
      </div>
    </div>
  );
}
