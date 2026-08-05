"use client";

type JoinRequester = {
  id: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  phone: string | null;
  favoriteGenres: string[];
  country: string | null;
  isGuest: boolean;
  emailVerified: boolean;
  memberSince: string;
};

export type PendingJoinRequest = {
  id: string;
  createdAt: string;
  requester: JoinRequester;
};

export function JoinRequestsPanel({
  requests,
  onApprove,
  onDeny,
}: {
  requests: PendingJoinRequest[];
  onApprove: (requestId: string) => void;
  onDeny: (requestId: string) => void;
}) {
  if (requests.length === 0) return null;

  return (
    <div className="border border-amber-500/30 bg-amber-500/10 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-amber-400/90">
        Join requests · {requests.length} waiting
      </p>
      <ul className="mt-3 space-y-3">
        {requests.map((r) => {
          const u = r.requester;
          const since = new Date(u.memberSince).toLocaleDateString(undefined, {
            month: "short",
            year: "numeric",
          });
          return (
            <li
              key={r.id}
              className="border border-cream/10 bg-ink-950/50 px-3 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-cream">
                    @{u.username}
                    {u.isGuest && (
                      <span className="ml-2 text-xs font-normal text-cream/45">
                        Guest
                      </span>
                    )}
                    {!u.emailVerified && !u.isGuest && (
                      <span className="ml-2 text-xs font-normal text-cream/45">
                        Email unverified
                      </span>
                    )}
                  </p>
                  {u.bio && (
                    <p className="mt-1 text-sm text-cream/65 line-clamp-2">
                      {u.bio}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-cream/45">
                    {[
                      u.phone,
                      u.favoriteGenres.length
                        ? u.favoriteGenres.slice(0, 4).join(" · ")
                        : null,
                      u.country,
                      `On CineMate since ${since}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => onApprove(r.id)}
                    className="bg-amber-500 px-3 py-1.5 text-sm font-medium text-ink-950 hover:bg-amber-400"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeny(r.id)}
                    className="border border-cream/20 px-3 py-1.5 text-sm text-cream/70 hover:border-red-400/40 hover:text-red-300"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
