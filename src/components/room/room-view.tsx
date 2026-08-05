"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RoomPlayer } from "@/components/room/room-player";
import { ChatPanel } from "@/components/room/chat-panel";
import { PresenceList } from "@/components/room/presence-list";
import { PlatformPicker } from "@/components/room/platform-picker";
import { ScreenShareStage } from "@/components/room/screen-share-stage";
import { ControlPanel } from "@/components/room/control-panel";
import {
  JoinRequestsPanel,
  type PendingJoinRequest,
} from "@/components/room/join-requests-panel";
import {
  useRoomChannel,
  type PlaybackState,
  type ChatMsg,
} from "@/hooks/use-room-channel";
import { useScreenShare } from "@/hooks/use-screen-share";
import type { PlatformId } from "@/lib/platforms";

type RoomPayload = {
  id: string;
  hostId: string;
  inviteCode: string;
  title: string | null;
  platform: string | null;
  contentUrl: string | null;
  controllerId: string | null;
  endedAt: string | null;
  host: { id: string; username: string; avatarUrl: string | null };
  members: {
    user: {
      id: string;
      username: string;
      avatarUrl: string | null;
      isGuest: boolean;
    };
  }[];
  playbackState: {
    positionSeconds: number;
    isPlaying: boolean;
    speed: number;
    updatedBy: string;
  } | null;
  messages: {
    id: string;
    userId: string;
    content: string;
    reaction: string | null;
    createdAt: string;
    user: { id: string; username: string; avatarUrl: string | null };
  }[];
};

export function RoomView({
  room,
  currentUser,
}: {
  room: RoomPayload;
  currentUser: { id: string; username: string };
}) {
  const router = useRouter();
  const isHost = room.hostId === currentUser.id;
  const [remoteState, setRemoteState] = useState<PlaybackState | null>(null);
  const [members, setMembers] = useState(room.members.map((m) => m.user));
  const [platform, setPlatform] = useState<string | null>(room.platform);
  const [contentUrl, setContentUrl] = useState<string | null>(room.contentUrl);
  const localObjectUrlRef = useRef<string | null>(null);
  const [controllerId, setControllerId] = useState(
    room.controllerId ?? room.hostId,
  );
  const [pendingRequest, setPendingRequest] = useState<{
    userId: string;
    username: string;
  } | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [joinRequests, setJoinRequests] = useState<PendingJoinRequest[]>([]);

  const onPlayback = useCallback((state: PlaybackState) => {
    setRemoteState(state);
  }, []);

  const onControlRequest = useCallback(
    (req: { userId: string; username: string }) => {
      if (isHost) setPendingRequest(req);
    },
    [isHost],
  );

  const onControlUpdate = useCallback((next: string) => {
    setControllerId(next);
    setPendingRequest(null);
    setRequestSent(false);
  }, []);

  const onControlDenied = useCallback(() => {
    setRequestSent(false);
  }, []);

  const onContentUpdate = useCallback(
    (content: { platform: string | null; contentUrl: string | null }) => {
      setPlatform(content.platform);
      // Don't overwrite a local blob with a null/remote placeholder
      if (content.contentUrl?.startsWith("blob:")) {
        setContentUrl(content.contentUrl);
      } else if (content.platform !== "local") {
        setContentUrl(content.contentUrl);
      }
    },
    [],
  );

  const {
    messages,
    presence,
    status,
    sendChat,
    broadcastPlayback,
    seedMessages,
    broadcastControlRequest,
    broadcastControlUpdate,
    broadcastControlDenied,
    broadcastContentUpdate,
  } = useRoomChannel({
    roomId: room.id,
    userId: currentUser.id,
    username: currentUser.username,
    onPlayback,
    onControlRequest,
    onControlUpdate,
    onControlDenied,
    onContentUpdate,
  });

  const canControl = currentUser.id === controllerId;
  const controllerName =
    members.find((m) => m.id === controllerId)?.username ??
    room.host.username;

  const {
    sharing,
    isRelay,
    remoteStream,
    error: shareError,
    startSharing,
    startRelay,
    stopSharing,
  } = useScreenShare({
    roomId: room.id,
    userId: currentUser.id,
    memberIds: members.map((m) => m.id),
  });

  const handleVideoElement = useCallback(
    (video: HTMLVideoElement | null) => {
      if (!canControl || !video) return;
      // Only relay true local files. Shared URLs/sample use playback sync instead
      // so host + buddy share the same seekable timeline and controls.
      const isLocalBlob = Boolean(contentUrl?.startsWith("blob:"));
      if (!isLocalBlob) return;

      const start = () => {
        try {
          const stream =
            (
              video as HTMLVideoElement & {
                captureStream?: () => MediaStream;
              }
            ).captureStream?.() ?? null;
          if (stream && stream.getTracks().length > 0) {
            void startRelay(stream);
          }
        } catch (e) {
          console.warn("[cinemate] captureStream failed", e);
        }
      };

      if (video.readyState >= 2) start();
      else video.addEventListener("loadeddata", start, { once: true });
      video.addEventListener("play", start, { once: true });
    },
    [canControl, contentUrl, startRelay],
  );

  // Drop stale WebRTC relay when host is on a shared URL / sample (not a local file)
  useEffect(() => {
    if (!canControl || !isRelay) return;
    if (contentUrl?.startsWith("blob:")) return;
    void stopSharing();
  }, [canControl, isRelay, contentUrl, stopSharing]);

  useEffect(() => {
    const initial: ChatMsg[] = room.messages.map((m) => ({
      id: m.id,
      userId: m.userId,
      username: m.user.username,
      content: m.content,
      createdAt: m.createdAt,
      reaction: m.reaction,
    }));
    seedMessages(initial);
  }, [room.messages, seedMessages]);

  async function copyInvite() {
    const url = `${window.location.origin}/rooms/join/${room.inviteCode}`;
    await navigator.clipboard.writeText(url);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  }

  async function endRoom() {
    await fetch(`/api/rooms/${room.id}/end`, { method: "POST" });
    router.push("/history");
    router.refresh();
  }

  async function kick(userId: string) {
    const res = await fetch(`/api/rooms/${room.id}/members/${userId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== userId));
      if (userId === controllerId) {
        setControllerId(room.hostId);
        await broadcastControlUpdate(room.hostId);
      }
    }
  }

  async function changePlatform(id: PlatformId) {
    setPlatform(id);
    if (id !== "local" && localObjectUrlRef.current) {
      URL.revokeObjectURL(localObjectUrlRef.current);
      localObjectUrlRef.current = null;
    }
    if (!isHost) return;
    await fetch(`/api/rooms/${room.id}/platform`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: id }),
    });
    await broadcastContentUpdate({
      platform: id,
      contentUrl: id === "local" ? null : contentUrl,
    });
  }

  async function changeContentUrl(url: string) {
    const next = url || null;
    if (localObjectUrlRef.current) {
      URL.revokeObjectURL(localObjectUrlRef.current);
      localObjectUrlRef.current = null;
    }
    setContentUrl(next);
    if (!isHost) return;
    await fetch(`/api/rooms/${room.id}/platform`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentUrl: next }),
    });
    await broadcastContentUpdate({ platform, contentUrl: next });
  }

  function loadLocalFile(file: File) {
    if (localObjectUrlRef.current) {
      URL.revokeObjectURL(localObjectUrlRef.current);
    }
    const blobUrl = URL.createObjectURL(file);
    localObjectUrlRef.current = blobUrl;
    setPlatform("local");
    setContentUrl(blobUrl);
    if (isHost) {
      void fetch(`/api/rooms/${room.id}/platform`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "local", contentUrl: null }),
      });
      void broadcastContentUpdate({ platform: "local", contentUrl: null });
    }
  }

  useEffect(() => {
    return () => {
      if (localObjectUrlRef.current) {
        URL.revokeObjectURL(localObjectUrlRef.current);
      }
    };
  }, []);

  async function requestControl() {
    setRequestSent(true);
    await fetch(`/api/rooms/${room.id}/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "request" }),
    });
    await broadcastControlRequest();
  }

  async function approveControl(userId: string) {
    const res = await fetch(`/api/rooms/${room.id}/control`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) return;
    setControllerId(userId);
    setPendingRequest(null);
    await broadcastControlUpdate(userId);
  }

  async function denyControl() {
    if (pendingRequest) {
      await broadcastControlDenied(pendingRequest.userId);
    }
    setPendingRequest(null);
  }

  async function reclaimControl() {
    const res = await fetch(`/api/rooms/${room.id}/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reclaim" }),
    });
    if (!res.ok) return;
    setControllerId(room.hostId);
    setPendingRequest(null);
    await broadcastControlUpdate(room.hostId);
  }

  useEffect(() => {
    if (!isHost) return;
    let cancelled = false;
    async function loadJoins() {
      const res = await fetch(`/api/rooms/${room.id}/join-requests`);
      const body = await res.json().catch(() => null);
      if (!res.ok || cancelled) return;
      setJoinRequests(body.requests ?? []);
    }
    void loadJoins();
    const id = window.setInterval(() => void loadJoins(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [isHost, room.id]);

  async function approveJoin(requestId: string) {
    const res = await fetch(`/api/rooms/${room.id}/join-requests`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action: "approve" }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) return;
    setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
    if (body?.member) {
      setMembers((prev) =>
        prev.some((m) => m.id === body.member.id)
          ? prev
          : [
              ...prev,
              {
                id: body.member.id,
                username: body.member.username,
                avatarUrl: null,
                isGuest: false,
              },
            ],
      );
    }
  }

  async function denyJoin(requestId: string) {
    const res = await fetch(`/api/rooms/${room.id}/join-requests`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action: "deny" }),
    });
    if (!res.ok) return;
    setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
  }

  if (room.endedAt) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-mist">
          Curtain call
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight">
          This room has ended
        </h1>
        <p className="mt-3 text-mist">Chat is saved in your watch history.</p>
      </div>
    );
  }

  const syncLabel =
    status === "connected"
      ? "live"
      : status === "error" || status === "disconnected"
        ? "sync (backup)"
        : status;
  const syncTone =
    status === "connected"
      ? "text-mint"
      : status === "error" || status === "disconnected"
        ? "text-[#ffb4aa]"
        : "text-mist";

  return (
    <div className="relative mx-auto max-w-[1400px] px-4 py-5 md:px-6 lg:px-8">
      {/* Immersive room header — marquee strip */}
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-ember/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-ember">
              <span className="h-1.5 w-1.5 rounded-full bg-ember sync-pulse" />
              Theater
            </span>
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${syncTone}`}>
              {syncLabel}
            </span>
          </div>
          <h1 className="mt-2 truncate font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            {room.title ?? "Watch together"}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copyInvite}
            className="btn-glass rounded-full px-4 py-2 text-sm"
          >
            {inviteCopied ? "Copied!" : "Copy invite"}
          </button>
          {canControl &&
            (sharing ? (
              <button
                type="button"
                onClick={() => void stopSharing()}
                className="rounded-full border border-ember/40 bg-ember/10 px-4 py-2 text-sm text-[#ffb4aa]"
              >
                Stop share
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void startSharing()}
                className="btn-glass rounded-full px-4 py-2 text-sm"
              >
                Share screen
              </button>
            ))}
          {isHost && (
            <button
              type="button"
              onClick={endRoom}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-mist transition hover:border-ember/40 hover:text-[#ffb4aa]"
            >
              End room
            </button>
          )}
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Stage column */}
        <div className="space-y-4">
          <ControlPanel
            isHost={isHost}
            canControl={canControl}
            controllerName={controllerName}
            pendingRequest={pendingRequest}
            requestSent={requestSent}
            onRequest={() => void requestControl()}
            onApprove={(id) => void approveControl(id)}
            onDeny={() => void denyControl()}
            onReclaim={() => void reclaimControl()}
          />

          {isHost && (
            <JoinRequestsPanel
              requests={joinRequests}
              onApprove={(id) => void approveJoin(id)}
              onDeny={(id) => void denyJoin(id)}
            />
          )}

          {shareError && <p className="text-sm text-[#ffb4aa]">{shareError}</p>}

          {sharing && !isRelay && (
            <ScreenShareStage
              localSharing
              remoteStream={null}
              sharerLabel="you"
            />
          )}

          {/* Screen as the visual center — soft vignette frame */}
          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-3 rounded-[1.75rem] bg-ember/10 blur-2xl"
              aria-hidden
            />
            <div className="relative overflow-hidden rounded-[1.25rem] border border-white/[0.08] bg-void shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
              <RoomPlayer
                canControl={canControl}
                platform={platform}
                contentUrl={contentUrl}
                initial={room.playbackState ?? undefined}
                remoteState={remoteState}
                onLocalChange={broadcastPlayback}
                onVideoElement={handleVideoElement}
                mediaStream={
                  !canControl &&
                  remoteStream &&
                  !contentUrl?.startsWith("blob:")
                    ? remoteStream
                    : null
                }
              />
            </div>
          </div>

          {platform === "local" &&
            !canControl &&
            !contentUrl?.startsWith("blob:") && (
              <p className="rounded-xl border border-ember/20 bg-ember/5 px-4 py-3 text-sm text-[#ffc9c3]">
                Host picked a local file. Choose the{" "}
                <strong>same video</strong> below for matching timeline +
                controls, or wait for their live stream.
              </p>
            )}

          <PlatformPicker
            value={platform}
            contentUrl={contentUrl}
            onChange={(id) => void changePlatform(id)}
            onContentUrlChange={(url) => void changeContentUrl(url)}
            onLocalFile={loadLocalFile}
            disabled={false}
            lockNonLocal={!canControl}
          />

          <details className="group glass-card rounded-2xl px-4 py-3 text-sm text-mist">
            <summary className="cursor-pointer list-none font-semibold text-pearl marker:content-none">
              <span className="flex items-center justify-between">
                How sync works
                <span className="text-mist transition group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <p className="mt-3 leading-relaxed border-t border-white/[0.06] pt-3">
              Load YouTube or a direct video/.mp4 — both screens play the same
              file and stay in sync. Local files: pick the same video on each
              device for full timeline sync (or use the live stream fallback).
              Guests need host approval. Only the controller drives play/seek.
            </p>
          </details>
        </div>

        {/* Lounge column — presence + chat */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]">
          <PresenceList
            members={members}
            presence={presence}
            hostId={room.hostId}
            currentUserId={currentUser.id}
            isHost={isHost}
            onKick={kick}
          />
          <div className="min-h-0 flex-1">
            <ChatPanel
              messages={messages}
              currentUserId={currentUser.id}
              onSend={sendChat}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
