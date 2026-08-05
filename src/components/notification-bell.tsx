"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (!res.ok) return;
    const body = await res.json();
    setItems(body.notifications);
    setUnread(body.unreadCount);
  }, []);

  useEffect(() => {
    void load();

    const tick = () => {
      if (document.visibilityState === "visible") void load();
    };

    // Was 15s — too chatty against a remote Seoul DB
    const id = window.setInterval(tick, 60_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [load]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function openItem(n: NotificationItem) {
    if (!n.read) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [n.id] }),
      });
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
      );
      setUnread((c) => Math.max(0, c - 1));
    }
    setOpen(false);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => {
          setOpen((v) => !v);
          void load();
        }}
        className="relative rounded p-1.5 text-cream/70 transition hover:bg-cream/5 hover:text-cream"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-ink-950">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 border border-cream/15 bg-ink-900 shadow-xl">
          <div className="flex items-center justify-between border-b border-cream/10 px-3 py-2">
            <p className="font-display text-lg tracking-wide text-cream">
              Notifications
            </p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-amber-400 hover:text-amber-300"
              >
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-cream/40">
                Nothing yet
              </li>
            )}
            {items.map((n) => {
              const inner = (
                <div
                  className={`border-b border-cream/5 px-3 py-2.5 text-left transition hover:bg-cream/5 ${
                    n.read ? "opacity-60" : ""
                  }`}
                >
                  <p className="text-sm text-cream">{n.title}</p>
                  {n.body && (
                    <p className="mt-0.5 text-xs text-cream/50">{n.body}</p>
                  )}
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-cream/35">
                    {formatDistanceToNow(new Date(n.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              );

              return (
                <li key={n.id}>
                  {n.href ? (
                    <Link href={n.href} onClick={() => void openItem(n)}>
                      {inner}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="w-full"
                      onClick={() => void openItem(n)}
                    >
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
