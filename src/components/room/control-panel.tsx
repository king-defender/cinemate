"use client";

type ControlPanelProps = {
  isHost: boolean;
  canControl: boolean;
  controllerName: string;
  pendingRequest: { userId: string; username: string } | null;
  requestSent: boolean;
  onRequest: () => void;
  onApprove: (userId: string) => void;
  onDeny: () => void;
  onReclaim: () => void;
};

export function ControlPanel({
  isHost,
  canControl,
  controllerName,
  pendingRequest,
  requestSent,
  onRequest,
  onApprove,
  onDeny,
  onReclaim,
}: ControlPanelProps) {
  return (
    <div className="border border-cream/10 bg-ink-900/80 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cream/40">
            Stream control
          </p>
          <p className="mt-1 text-sm text-cream">
            Controller:{" "}
            <span className="text-amber-400">@{controllerName}</span>
            {canControl && (
              <span className="ml-2 text-xs text-emerald-400">(you)</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!isHost && !canControl && (
            <button
              type="button"
              disabled={requestSent}
              onClick={onRequest}
              className="border border-amber-500/40 px-3 py-1.5 text-sm text-amber-300 hover:bg-amber-500/10 disabled:opacity-50"
            >
              {requestSent ? "Request sent…" : "Request play permission"}
            </button>
          )}
          {isHost && canControl === false && (
            <button
              type="button"
              onClick={onReclaim}
              className="border border-cream/20 px-3 py-1.5 text-sm text-cream/80 hover:border-amber-500/40"
            >
              Reclaim control
            </button>
          )}
        </div>
      </div>

      {isHost && pendingRequest && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border border-amber-500/25 bg-amber-500/10 px-3 py-2">
          <p className="text-sm text-cream">
            @{pendingRequest.username} wants to control playback
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onApprove(pendingRequest.userId)}
              className="bg-amber-500 px-3 py-1 text-sm font-medium text-ink-950 hover:bg-amber-400"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={onDeny}
              className="border border-cream/20 px-3 py-1 text-sm text-cream/70"
            >
              Deny
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
