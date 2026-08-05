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
    <div className="glass-card rounded-2xl px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-mist">
            Remote
          </p>
          <p className="mt-1 text-sm">
            Controller{" "}
            <span className="font-semibold text-ember">@{controllerName}</span>
            {canControl && (
              <span className="ml-2 text-xs text-mint">(you)</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!isHost && !canControl && (
            <button
              type="button"
              disabled={requestSent}
              onClick={onRequest}
              className="rounded-full border border-mint/35 px-3.5 py-1.5 text-sm text-mint hover:bg-mint/10 disabled:opacity-50"
            >
              {requestSent ? "Request sent…" : "Request play permission"}
            </button>
          )}
          {isHost && canControl === false && (
            <button
              type="button"
              onClick={onReclaim}
              className="btn-glass rounded-full px-3.5 py-1.5 text-sm"
            >
              Reclaim control
            </button>
          )}
        </div>
      </div>

      {isHost && pendingRequest && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ember/25 bg-ember/10 px-3 py-2.5">
          <p className="text-sm">
            @{pendingRequest.username} wants to control playback
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onApprove(pendingRequest.userId)}
              className="btn-cinema rounded-full px-3.5 py-1 text-sm"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={onDeny}
              className="btn-glass rounded-full px-3.5 py-1 text-sm"
            >
              Deny
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
