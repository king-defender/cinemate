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
    <div className="border border-cream/10 bg-ink-900/80">
      <div className="border-b border-cream/10 px-4 py-3">
        <h2 className="font-display text-lg tracking-wide text-cream">
          In the room ({members.length})
        </h2>
      </div>
      <ul className="divide-y divide-cream/5">
        {members.map((m) => {
          const online = onlineIds.has(m.id);
          return (
            <li
              key={m.id}
              className="flex items-center justify-between gap-2 px-4 py-3 text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    online ? "bg-emerald-400" : "bg-cream/20"
                  }`}
                />
                <span className="truncate text-cream">
                  {m.username}
                  {m.id === hostId && (
                    <span className="ml-2 text-[10px] uppercase tracking-widest text-amber-400">
                      host
                    </span>
                  )}
                  {m.isGuest && (
                    <span className="ml-2 text-[10px] uppercase tracking-widest text-cream/40">
                      guest
                    </span>
                  )}
                </span>
              </div>
              {isHost && m.id !== currentUserId && m.id !== hostId && onKick && (
                <button
                  type="button"
                  onClick={() => onKick(m.id)}
                  className="text-xs text-cream/40 hover:text-red-300"
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
