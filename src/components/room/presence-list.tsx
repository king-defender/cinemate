"use client";

import type { PresenceUser } from "@/hooks/use-room-channel";

type Member = {
  id: string;
  username: string;
  avatarUrl: string | null;
  isGuest?: boolean;
};

type PresenceListProps = {
  members: Member[];
  presence: PresenceUser[];
  hostId: string;
  currentUserId: string;
  isHost: boolean;
  onKick?: (userId: string) => void;
};

export function PresenceList({
  members,
  presence,
  hostId,
  currentUserId,
  isHost,
  onKick,
}: PresenceListProps) {
  const onlineIds = new Set(presence.map((p) => p.userId));

  return (
    <div className="glass-card overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <h2 className="font-display text-base font-bold tracking-tight">
          In the seats
        </h2>
        <span className="rounded-full bg-white/[0.05] px-2.5 py-0.5 text-[11px] font-semibold text-mist">
          {members.length}
        </span>
      </div>
      <ul className="max-h-48 divide-y divide-white/[0.04] overflow-y-auto">
        {members.map((m) => {
          const online = onlineIds.has(m.id);
          return (
            <li
              key={m.id}
              className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel-lift text-[11px] font-bold">
                  {m.username.slice(0, 1).toUpperCase()}
                  <span
                    className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ring-2 ring-panel ${
                      online ? "bg-mint" : "bg-mist/30"
                    }`}
                  />
                </span>
                <span className="truncate">
                  {m.username}
                  {m.id === hostId && (
                    <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-ember">
                      host
                    </span>
                  )}
                  {m.isGuest && (
                    <span className="ml-2 text-[10px] uppercase tracking-widest text-mist/50">
                      guest
                    </span>
                  )}
                </span>
              </div>
              {isHost && m.id !== currentUserId && m.id !== hostId && onKick && (
                <button
                  type="button"
                  onClick={() => onKick(m.id)}
                  className="text-xs text-mist/50 transition hover:text-[#ffb4aa]"
                >
                  Remove
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
