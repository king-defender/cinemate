"use client";

import {
  useEffect,
  useRef,
  useState,
  useEffectEvent,
  useId,
} from "react";
import type { PlaybackState } from "@/hooks/use-room-channel";
import {
  resolveRoomContent,
  DEFAULT_SAMPLE,
} from "@/lib/platforms";

type RoomPlayerProps = {
  canControl: boolean;
  platform: string | null;
  contentUrl: string | null;
  initial?: Partial<PlaybackState>;
  onLocalChange: (state: Omit<PlaybackState, "updatedBy">) => void;
  remoteState: PlaybackState | null;
  /** Fires when the HTML5 video element is ready (for WebRTC relay) */
  onVideoElement?: (video: HTMLVideoElement | null) => void;
  /** Incoming host stream (local-file / screen relay) — same player chrome as host */
  mediaStream?: MediaStream | null;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: string | HTMLElement,
        opts: Record<string, unknown>,
      ) => YtPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; BUFFERING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YtPlayer = {
  destroy: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getPlayerState: () => number;
  setPlaybackRate: (rate: number) => void;
};

function loadYoutubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  return new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.getElementById("yt-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "yt-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
  });
}

export function RoomPlayer({
  canControl,
  platform,
  contentUrl,
  initial,
  onLocalChange,
  remoteState,
  onVideoElement,
  mediaStream,
}: RoomPlayerProps) {
  // Live relay only when buddy has no local copy of the file
  if (mediaStream && !canControl) {
    return (
      <Html5Player
        src={null}
        mediaStream={mediaStream}
        canControl={false}
        initial={initial}
        onLocalChange={onLocalChange}
        remoteState={null}
        banner="Live stream from host — pick the same local file below for full timeline sync"
      />
    );
  }

  const content = resolveRoomContent(platform, contentUrl);

  if (content.kind === "youtube") {
    return (
      <YoutubePlayer
        videoId={content.src}
        canControl={canControl}
        initial={initial}
        onLocalChange={onLocalChange}
        remoteState={remoteState}
      />
    );
  }

  if (content.kind === "iframe") {
    return <IframePlayer src={content.src} canControl={canControl} />;
  }

  if (content.kind === "video") {
    return (
      <Html5Player
        src={content.src}
        canControl={canControl}
        initial={initial}
        onLocalChange={onLocalChange}
        remoteState={remoteState}
        onVideoElement={onVideoElement}
      />
    );
  }

  return (
    <Html5Player
      src={DEFAULT_SAMPLE}
      canControl={canControl}
      initial={initial}
      onLocalChange={onLocalChange}
      remoteState={remoteState}
      onVideoElement={onVideoElement}
      banner={
        platform === "local"
          ? "Choose a local video below — it will stream to everyone in the room"
          : platform === "youtube"
            ? "Paste a YouTube link below to load it here"
            : platform === "website"
              ? "Paste a website or .mp4 URL below to load it here"
              : "Paste a YouTube/.mp4 link below — or Share screen for Netflix-style apps"
      }
    />
  );
}

function Html5Player({
  src,
  mediaStream,
  canControl,
  initial,
  onLocalChange,
  remoteState,
  banner,
  onVideoElement,
}: {
  src: string | null;
  mediaStream?: MediaStream | null;
  canControl: boolean;
  initial?: Partial<PlaybackState>;
  onLocalChange: (state: Omit<PlaybackState, "updatedBy">) => void;
  remoteState: PlaybackState | null;
  banner?: string;
  onVideoElement?: (video: HTMLVideoElement | null) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [speed, setSpeed] = useState(initial?.speed ?? 1);
  const [error, setError] = useState<string | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const applyingRemote = useRef(false);
  const lastRemote = useRef<PlaybackState | null>(null);
  const lastHeartbeat = useRef(0);
  const isLiveStream = Boolean(mediaStream);

  useEffect(() => {
    onVideoElement?.(videoRef.current);
    return () => onVideoElement?.(null);
  }, [src, mediaStream, onVideoElement]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !mediaStream) return;
    video.srcObject = mediaStream;
    setError(null);
    setAutoplayBlocked(false);
    void video.play().catch(() => setAutoplayBlocked(true));
    return () => {
      video.srcObject = null;
    };
  }, [mediaStream]);

  const applyRemote = useEffectEvent((state: PlaybackState) => {
    const video = videoRef.current;
    if (!video || isLiveStream) return;
    lastRemote.current = state;
    applyingRemote.current = true;

    const latencySec =
      state.isPlaying && state.sentAt
        ? Math.max(0, (Date.now() - state.sentAt) / 1000) * (state.speed || 1)
        : 0;
    const target = state.positionSeconds + latencySec;
    const drift = Math.abs(video.currentTime - target);

    if (drift > 0.45 || Math.abs(video.playbackRate - state.speed) > 0.01) {
      video.currentTime = target;
      video.playbackRate = state.speed;
      setSpeed(state.speed);
    }

    if (state.isPlaying && video.paused) {
      void video.play().catch(() => setAutoplayBlocked(true));
    } else if (!state.isPlaying && !video.paused) {
      video.pause();
    }

    window.setTimeout(() => {
      applyingRemote.current = false;
    }, 80);
  });

  useEffect(() => {
    if (!remoteState || canControl || isLiveStream) return;
    applyRemote(remoteState);
  }, [remoteState, canControl, applyRemote, isLiveStream]);

  useEffect(() => {
    if (mediaStream) return;
    const video = videoRef.current;
    if (!video || !src) return;
    setError(null);
    video.load();
    if (initial?.positionSeconds) video.currentTime = initial.positionSeconds;
    video.playbackRate = initial?.speed ?? 1;
  }, [src, mediaStream, initial?.positionSeconds, initial?.speed]);

  function emit() {
    if (!canControl || applyingRemote.current || isLiveStream) return;
    const video = videoRef.current;
    if (!video) return;
    onLocalChange({
      positionSeconds: video.currentTime,
      isPlaying: !video.paused,
      speed: video.playbackRate,
    });
  }

  /** Buddy scrubbing/pausing must snap back to host timeline */
  function onViewerInteract() {
    if (canControl || isLiveStream || applyingRemote.current) return;
    if (lastRemote.current) applyRemote(lastRemote.current);
  }

  useEffect(() => {
    if (!canControl || isLiveStream) return;
    const id = window.setInterval(() => {
      const video = videoRef.current;
      if (!video || video.paused) return;
      const now = Date.now();
      if (now - lastHeartbeat.current < 1800) return;
      lastHeartbeat.current = now;
      onLocalChange({
        positionSeconds: video.currentTime,
        isPlaying: true,
        speed: video.playbackRate,
      });
    }, 2000);
    return () => window.clearInterval(id);
  }, [canControl, onLocalChange, isLiveStream]);

  return (
    <div className="relative flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-sm bg-ink-950 aspect-video ring-1 ring-amber-500/20">
        <video
          ref={videoRef}
          key={mediaStream ? "stream" : (src ?? "empty")}
          className="h-full w-full object-contain bg-black"
          {...(src && !mediaStream ? { src } : {})}
          playsInline
          controls
          preload="metadata"
          onPlay={() => {
            if (canControl) emit();
            else onViewerInteract();
          }}
          onPause={() => {
            if (canControl) emit();
            else onViewerInteract();
          }}
          onSeeked={() => {
            if (canControl) emit();
            else onViewerInteract();
          }}
          onRateChange={() => {
            if (canControl) emit();
            else onViewerInteract();
          }}
          onError={() =>
            setError(
              isLiveStream
                ? "Could not play the live stream. Ask the host to reload the file."
                : "Could not load this video. Try a YouTube or direct .mp4 link.",
            )
          }
        />
        {banner && (
          <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent px-3 py-3 text-xs text-cream/80">
            {banner}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-cream/70">
        {canControl && (
          <label className="flex items-center gap-2">
            Speed
            <select
              className="border border-cream/15 bg-ink-900 px-2 py-1 text-cream"
              value={speed}
              onChange={(e) => {
                const next = Number(e.target.value);
                setSpeed(next);
                if (videoRef.current) {
                  videoRef.current.playbackRate = next;
                  emit();
                }
              }}
            >
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                <option key={s} value={s}>
                  {s}x
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex items-center gap-2">
          Volume
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            defaultValue={1}
            className="w-24 accent-amber-500"
            onChange={(e) => {
              const el = videoRef.current;
              if (!el) return;
              el.volume = Number(e.target.value);
              el.muted = Number(e.target.value) === 0;
            }}
          />
        </label>
        <button
          type="button"
          className="border border-cream/15 px-2 py-1 text-cream/80 hover:border-amber-500/40"
          onClick={() => {
            const el = videoRef.current;
            if (!el) return;
            void (document.fullscreenElement
              ? document.exitFullscreen()
              : el.requestFullscreen());
          }}
        >
          Full screen
        </button>
        {autoplayBlocked && (
          <button
            type="button"
            className="bg-amber-500 px-2 py-1 font-medium text-ink-950"
            onClick={() => {
              setAutoplayBlocked(false);
              void videoRef.current?.play().catch(() => setAutoplayBlocked(true));
            }}
          >
            Tap to play sound
          </button>
        )}
        <span className="text-cream/40">
          {canControl
            ? "You control playback for the room"
            : isLiveStream
              ? "Live feed · volume & fullscreen are local"
              : "Synced with host · volume is local · play/seek follow the host"}
        </span>
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}

function YoutubePlayer({
  videoId,
  canControl,
  initial,
  onLocalChange,
  remoteState,
}: {
  videoId: string;
  canControl: boolean;
  initial?: Partial<PlaybackState>;
  onLocalChange: (state: Omit<PlaybackState, "updatedBy">) => void;
  remoteState: PlaybackState | null;
}) {
  const elId = useId().replace(/:/g, "");
  const playerRef = useRef<YtPlayer | null>(null);
  const applyingRemote = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await loadYoutubeApi();
      if (cancelled || !window.YT) return;
      playerRef.current?.destroy();
      playerRef.current = new window.YT.Player(elId, {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: () => {
            setReady(true);
            if (initial?.positionSeconds) {
              playerRef.current?.seekTo(initial.positionSeconds, true);
            }
          },
          onStateChange: (e: { data: number }) => {
            if (!canControl || applyingRemote.current || !playerRef.current) return;
            const YT = window.YT!;
            const playing = e.data === YT.PlayerState.PLAYING;
            const paused = e.data === YT.PlayerState.PAUSED;
            if (!playing && !paused) return;
            onLocalChange({
              positionSeconds: playerRef.current.getCurrentTime(),
              isPlaying: playing,
              speed: 1,
            });
          },
        },
      });
    })();
    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId, elId, canControl, initial?.positionSeconds, onLocalChange]);

  useEffect(() => {
    if (!remoteState || canControl || !ready || !playerRef.current) return;
    applyingRemote.current = true;
    const p = playerRef.current;
    const latencySec =
      remoteState.isPlaying && remoteState.sentAt
        ? Math.max(0, (Date.now() - remoteState.sentAt) / 1000)
        : 0;
    const target = remoteState.positionSeconds + latencySec;
    const drift = Math.abs(p.getCurrentTime() - target);
    if (drift > 0.6) p.seekTo(target, true);
    if (remoteState.isPlaying) p.playVideo();
    else p.pauseVideo();
    window.setTimeout(() => {
      applyingRemote.current = false;
    }, 120);
  }, [remoteState, canControl, ready]);

  useEffect(() => {
    if (!canControl || !ready) return;
    const id = window.setInterval(() => {
      const p = playerRef.current;
      if (!p || !window.YT) return;
      if (p.getPlayerState() !== window.YT.PlayerState.PLAYING) return;
      onLocalChange({
        positionSeconds: p.getCurrentTime(),
        isPlaying: true,
        speed: 1,
      });
    }, 2000);
    return () => window.clearInterval(id);
  }, [canControl, ready, onLocalChange]);

  return (
    <div className="relative overflow-hidden rounded-sm bg-ink-950 aspect-video ring-1 ring-amber-500/20">
      <div id={elId} className="h-full w-full" />
      {!canControl && (
        <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent px-3 py-2 text-xs text-cream/70">
          Synced with host · volume is local · play/seek follow the host
        </div>
      )}
    </div>
  );
}

function IframePlayer({ src, canControl }: { src: string; canControl: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-sm bg-ink-950 aspect-video ring-1 ring-amber-500/20">
      <iframe
        title="Room content"
        src={src}
        className="h-full w-full border-0 bg-black"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-x-0 bottom-0 bg-ink-950/80 px-3 py-2 text-xs text-cream/60">
        {canControl
          ? "Embedded page — if it stays blank, the site blocks iframes; use Share screen instead"
          : "Embedded page (view) — sync may be limited; ask host for control or use chat"}
      </div>
    </div>
  );
}
