"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { WATCH_PLATFORMS, type PlatformId, getPlatform } from "@/lib/platforms";

type PlatformPickerProps = {
  value: string | null;
  contentUrl: string | null;
  onChange: (id: PlatformId) => void;
  onContentUrlChange: (url: string) => void;
  onLocalFile: (file: File) => void;
  disabled?: boolean;
  /** Viewers can still pick a local file, but not change other sources */
  lockNonLocal?: boolean;
};

export function PlatformPicker({
  value,
  contentUrl,
  onChange,
  onContentUrlChange,
  onLocalFile,
  disabled,
  lockNonLocal,
}: PlatformPickerProps) {
  const selected = getPlatform(value);
  const [draft, setDraft] = useState(contentUrl ?? "");
  const [localName, setLocalName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!contentUrl?.startsWith("blob:")) {
      setDraft(contentUrl ?? "");
    }
  }, [contentUrl]);

  function submitUrl(e: FormEvent) {
    e.preventDefault();
    onContentUrlChange(draft.trim());
  }

  function pickFile(file: File | undefined) {
    if (!file) return;
    setLocalName(file.name);
    onLocalFile(file);
  }

  const placeholder =
    selected?.playMode === "youtube"
      ? "https://www.youtube.com/watch?v=…"
      : selected?.id === "website"
        ? "https://example.com/video or any page URL"
        : "YouTube / .mp4 link to play in the room player";

  const isLocal = selected?.playMode === "local";
  const showUrlForm =
    selected &&
    selected.playMode !== "screenshare" &&
    selected.playMode !== "local";

  return (
    <div className="border border-cream/10 bg-ink-900/80 p-4">
      <p className="font-display text-lg tracking-wide text-cream">
        Watching on
      </p>
      <p className="mt-1 text-xs leading-relaxed text-cream/45">
        Fastest option: <span className="text-cream/70">Local file</span> —
        plays from your PC with no upload. YouTube/website links also work in
        the player.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {WATCH_PLATFORMS.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={disabled || (lockNonLocal && p.id !== "local")}
            onClick={() => onChange(p.id)}
            className={
              value === p.id
                ? "bg-amber-500 px-3 py-1.5 text-sm font-medium text-ink-950"
                : "border border-cream/15 px-3 py-1.5 text-sm text-cream/70 hover:border-amber-500/40 disabled:opacity-40"
            }
          >
            {p.name}
          </button>
        ))}
      </div>

      {selected && (
        <p className="mt-3 text-xs text-cream/50">{selected.hint}</p>
      )}

      {isLocal && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="video/*,audio/*,.mp4,.webm,.mkv,.mov,.avi"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => fileRef.current?.click()}
            className="bg-amber-500 px-4 py-2 text-sm font-medium text-ink-950 hover:bg-amber-400 disabled:opacity-50"
          >
            Choose local video
          </button>
          {localName && (
            <span className="text-sm text-cream/70 truncate max-w-[220px]">
              {localName}
            </span>
          )}
          <p className="w-full text-xs text-cream/40">
            Nothing is uploaded. The host&apos;s player is streamed live to
            everyone. Guests can also pick the same file for a sharper local
            copy.
          </p>
        </div>
      )}

      {showUrlForm && (
        <form onSubmit={submitUrl} className="mt-3 flex flex-wrap gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            className="min-w-[220px] flex-1 border border-cream/15 bg-ink-950 px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:border-amber-500/50 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={disabled}
            className="bg-amber-500 px-4 py-2 text-sm font-medium text-ink-950 hover:bg-amber-400 disabled:opacity-50"
          >
            Load in player
          </button>
          {selected?.url && (
            <a
              href={selected.url}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-cream/20 px-3 py-2 text-sm text-cream/70 hover:border-amber-500/40"
            >
              Open {selected.name} ↗
            </a>
          )}
        </form>
      )}
    </div>
  );
}
