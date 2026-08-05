"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type ChatMsg = {
  id?: string;
  userId: string;
  username?: string;
  content: string;
  createdAt: string;
  reaction?: string | null;
};

export type PlaybackState = {
  positionSeconds: number;
  isPlaying: boolean;
  speed: number;
  updatedBy: string;
  /** Client clock when host sent this — used to correct network delay */
  sentAt?: number;
};

export type PresenceUser = {
  userId: string;
  username: string;
  online_at: string;
};

export type ChannelStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

type UseRoomChannelOpts = {
  roomId: string;
  userId: string;
  username: string;
  onPlayback?: (state: PlaybackState) => void;
  onControlRequest?: (req: { userId: string; username: string }) => void;
  onControlUpdate?: (controllerId: string) => void;
  onControlDenied?: () => void;
  onContentUpdate?: (content: {
    platform: string | null;
    contentUrl: string | null;
  }) => void;
};

function upsertMessage(prev: ChatMsg[], msg: ChatMsg) {
  if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
  const withoutOptimistic = prev.filter(
    (m) =>
      !(
        !m.id &&
        m.userId === msg.userId &&
        m.content === msg.content
      ),
  );
  return [...withoutOptimistic, msg];
}

export function useRoomChannel({
  roomId,
  userId,
  username,
  onPlayback,
  onControlRequest,
  onControlUpdate,
  onControlDenied,
  onContentUpdate,
}: UseRoomChannelOpts) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [status, setStatus] = useState<ChannelStatus>("connecting");
  const channelRef = useRef<RealtimeChannel | null>(null);
  const subscribedRef = useRef(false);
  const lastBroadcastRef = useRef(0);
  const lastPolledPlayback = useRef("");
  const onPlaybackRef = useRef(onPlayback);
  const onControlRequestRef = useRef(onControlRequest);
  const onControlUpdateRef = useRef(onControlUpdate);
  const onControlDeniedRef = useRef(onControlDenied);
  const onContentUpdateRef = useRef(onContentUpdate);
  onPlaybackRef.current = onPlayback;
  onControlRequestRef.current = onControlRequest;
  onControlUpdateRef.current = onControlUpdate;
  onControlDeniedRef.current = onControlDenied;
  onContentUpdateRef.current = onContentUpdate;

  // Realtime channel with reconnect on transport failure
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    let activeChannel: RealtimeChannel | null = null;

    async function connect() {
      if (cancelled) return;
      setStatus("connecting");
      subscribedRef.current = false;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      // Critical: Realtime must use the user JWT, not the publishable API key
      await supabase.realtime.setAuth(session?.access_token ?? "");

      if (activeChannel) {
        await supabase.removeChannel(activeChannel);
        activeChannel = null;
        channelRef.current = null;
      }

      const channel = supabase.channel(`room:${roomId}`, {
        config: {
          broadcast: { self: false, ack: false },
          presence: { key: userId },
        },
      });
      activeChannel = channel;
      channelRef.current = channel;

      channel
        .on("broadcast", { event: "chat:message" }, ({ payload }) => {
          const msg = payload as ChatMsg;
          if (msg.userId === userId) return;
          setMessages((prev) => upsertMessage(prev, msg));
        })
        .on("broadcast", { event: "chat:reaction" }, ({ payload }) => {
          const { messageId, emoji } = payload as {
            messageId: string;
            emoji: string;
          };
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId ? { ...m, reaction: emoji } : m,
            ),
          );
        })
        .on("broadcast", { event: "playback:sync" }, ({ payload }) => {
          const state = payload as PlaybackState;
          if (state.updatedBy === userId) return;
          onPlaybackRef.current?.(state);
        })
        .on("broadcast", { event: "control:request" }, ({ payload }) => {
          const req = payload as { userId: string; username: string };
          if (req.userId === userId) return;
          onControlRequestRef.current?.(req);
        })
        .on("broadcast", { event: "control:update" }, ({ payload }) => {
          const { controllerId } = payload as { controllerId: string };
          onControlUpdateRef.current?.(controllerId);
        })
        .on("broadcast", { event: "control:denied" }, ({ payload }) => {
          const { userId: deniedId } = payload as { userId: string };
          if (deniedId === userId) onControlDeniedRef.current?.();
        })
        .on("broadcast", { event: "content:update" }, ({ payload }) => {
          const content = payload as {
            platform: string | null;
            contentUrl: string | null;
          };
          onContentUpdateRef.current?.(content);
        })
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "ChatMessage",
            filter: `roomId=eq.${roomId}`,
          },
          (payload) => {
            const row = payload.new as {
              id: string;
              userId: string;
              content: string;
              reaction: string | null;
              createdAt: string;
            };
            if (row.userId === userId) return;
            setMessages((prev) =>
              upsertMessage(prev, {
                id: row.id,
                userId: row.userId,
                content: row.content,
                reaction: row.reaction,
                createdAt: row.createdAt,
                username: "viewer",
              }),
            );
          },
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "RoomPlaybackState",
            filter: `roomId=eq.${roomId}`,
          },
          (payload) => {
            const row = payload.new as {
              positionSeconds: number;
              isPlaying: boolean;
              speed: number;
              updatedBy: string;
            } | null;
            if (!row || row.updatedBy === userId) return;
            onPlaybackRef.current?.({
              positionSeconds: row.positionSeconds,
              isPlaying: row.isPlaying,
              speed: row.speed,
              updatedBy: row.updatedBy,
              sentAt: Date.now(),
            });
          },
        )
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState<PresenceUser>();
          const list: PresenceUser[] = [];
          Object.values(state).forEach((arr) => {
            arr.forEach((p) => list.push(p));
          });
          setPresence(list);
        })
        .subscribe(async (subStatus, err) => {
          if (cancelled) return;
          if (subStatus === "SUBSCRIBED") {
            attempt = 0;
            subscribedRef.current = true;
            setStatus("connected");
            await channel.track({
              userId,
              username,
              online_at: new Date().toISOString(),
            });
            return;
          }

          if (
            subStatus === "CHANNEL_ERROR" ||
            subStatus === "TIMED_OUT" ||
            subStatus === "CLOSED"
          ) {
            subscribedRef.current = false;
            setStatus(subStatus === "CLOSED" ? "disconnected" : "error");
            if (err) {
              console.warn("[cinemate] realtime", subStatus, err);
            }
            // Auto-reconnect — transport failures are often transient
            if (!cancelled) {
              const delay = Math.min(1000 * 2 ** attempt, 12_000);
              attempt += 1;
              if (retryTimer) clearTimeout(retryTimer);
              retryTimer = setTimeout(() => {
                void connect();
              }, delay);
            }
          }
        });
    }

    void connect();

    return () => {
      cancelled = true;
      subscribedRef.current = false;
      if (retryTimer) clearTimeout(retryTimer);
      if (activeChannel) {
        void supabase.removeChannel(activeChannel);
      }
      channelRef.current = null;
    };
  }, [roomId, userId, username]);

  // HTTP polling backup — keeps play/pause/seek in sync when WebSocket drops
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/rooms/${roomId}/playback`, {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const body = await res.json();
        const state = body.state as
          | {
              positionSeconds: number;
              isPlaying: boolean;
              speed: number;
              updatedBy: string;
              updatedAt?: string;
            }
          | null;
        if (!state || state.updatedBy === userId) return;
        const sig = `${state.updatedBy}:${state.positionSeconds.toFixed(2)}:${state.isPlaying}:${state.speed}:${state.updatedAt ?? ""}`;
        if (sig === lastPolledPlayback.current) return;
        lastPolledPlayback.current = sig;
        onPlaybackRef.current?.({
          positionSeconds: state.positionSeconds,
          isPlaying: state.isPlaying,
          speed: state.speed,
          updatedBy: state.updatedBy,
          sentAt: Date.now(),
        });
      } catch {
        // ignore transient network errors
      }
    }

    void poll();
    // Faster poll while realtime is unhealthy
    const ms = status === "connected" ? 2500 : 900;
    const id = window.setInterval(() => void poll(), ms);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [roomId, userId, status]);

  const sendChat = useCallback(
    async (content: string) => {
      const createdAt = new Date().toISOString();
      const optimistic: ChatMsg = {
        userId,
        username,
        content,
        createdAt,
      };
      setMessages((prev) => [...prev, optimistic]);

      const res = await fetch(`/api/rooms/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) return;

      const { message } = await res.json();
      const finalMsg: ChatMsg = {
        id: message.id,
        userId: message.userId,
        username: message.user.username,
        content: message.content,
        createdAt: message.createdAt,
      };
      setMessages((prev) => upsertMessage(prev, finalMsg));

      if (subscribedRef.current && channelRef.current) {
        const result = await channelRef.current.send({
          type: "broadcast",
          event: "chat:message",
          payload: finalMsg,
        });
        if (result !== "ok") {
          console.warn("[cinemate] chat broadcast failed", result);
        }
      }
    },
    [roomId, userId, username],
  );

  const broadcastPlayback = useCallback(
    async (state: Omit<PlaybackState, "updatedBy" | "sentAt">) => {
      const now = Date.now();
      if (now - lastBroadcastRef.current < 200) return;
      lastBroadcastRef.current = now;

      const payload: PlaybackState = {
        ...state,
        updatedBy: userId,
        sentAt: now,
      };

      if (subscribedRef.current && channelRef.current) {
        const result = await channelRef.current.send({
          type: "broadcast",
          event: "playback:sync",
          payload,
        });
        if (result !== "ok") {
          console.warn("[cinemate] playback broadcast failed", result);
        }
      }

      // Always persist — HTTP poll + postgres_changes use this
      void fetch(`/api/rooms/${roomId}/playback`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
    },
    [roomId, userId],
  );

  const seedMessages = useCallback((initial: ChatMsg[]) => {
    setMessages(initial);
  }, []);

  const broadcastControlRequest = useCallback(async () => {
    if (!subscribedRef.current || !channelRef.current) return;
    await channelRef.current.send({
      type: "broadcast",
      event: "control:request",
      payload: { userId, username },
    });
  }, [userId, username]);

  const broadcastControlUpdate = useCallback(async (controllerId: string) => {
    if (!subscribedRef.current || !channelRef.current) return;
    await channelRef.current.send({
      type: "broadcast",
      event: "control:update",
      payload: { controllerId },
    });
  }, []);

  const broadcastControlDenied = useCallback(async (deniedUserId: string) => {
    if (!subscribedRef.current || !channelRef.current) return;
    await channelRef.current.send({
      type: "broadcast",
      event: "control:denied",
      payload: { userId: deniedUserId },
    });
  }, []);

  const broadcastContentUpdate = useCallback(
    async (content: { platform: string | null; contentUrl: string | null }) => {
      if (!subscribedRef.current || !channelRef.current) return;
      await channelRef.current.send({
        type: "broadcast",
        event: "content:update",
        payload: content,
      });
    },
    [],
  );

  return {
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
  };
}
