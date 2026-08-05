"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

type SignalPayload = {
  fromUserId: string;
  toUserId?: string;
  type: "offer" | "answer" | "ice-candidate" | "screenshare-ended";
  payload?: RTCSessionDescriptionInit | RTCIceCandidateInit | null;
};

type UseScreenShareOpts = {
  roomId: string;
  userId: string;
  memberIds: string[];
};

const ICE: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useScreenShare({
  roomId,
  userId,
  memberIds,
}: UseScreenShareOpts) {
  const [sharing, setSharing] = useState(false);
  /** True when we relay an HTML video element (local file) — keep the player visible on host */
  const [isRelay, setIsRelay] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [sharerId, setSharerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const isRelayRef = useRef(false);
  const memberIdsRef = useRef(memberIds);
  memberIdsRef.current = memberIds;

  const sendSignal = useCallback(async (msg: SignalPayload) => {
    await channelRef.current?.send({
      type: "broadcast",
      event: "webrtc:signal",
      payload: msg,
    });
  }, []);

  const cleanupPeer = useCallback((peerId: string) => {
    const pc = peersRef.current.get(peerId);
    if (pc) {
      pc.close();
      peersRef.current.delete(peerId);
    }
  }, []);

  const stopSharing = useCallback(async () => {
    if (!isRelayRef.current) {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    }
    localStreamRef.current = null;
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
    isRelayRef.current = false;
    setIsRelay(false);
    setSharing(false);
    await sendSignal({
      fromUserId: userId,
      type: "screenshare-ended",
    });
  }, [sendSignal, userId]);

  const createPeer = useCallback(
    (remoteUserId: string, asOfferer: boolean) => {
      cleanupPeer(remoteUserId);
      const pc = new RTCPeerConnection(ICE);
      peersRef.current.set(remoteUserId, pc);

      pc.onicecandidate = (e) => {
        if (!e.candidate) return;
        void sendSignal({
          fromUserId: userId,
          toUserId: remoteUserId,
          type: "ice-candidate",
          payload: e.candidate.toJSON(),
        });
      };

      pc.ontrack = (e) => {
        const stream = e.streams[0];
        if (stream) {
          setRemoteStream(stream);
          setSharerId(remoteUserId);
        }
      };

      const local = localStreamRef.current;
      if (local && asOfferer) {
        local.getTracks().forEach((track) => pc.addTrack(track, local));
      }

      return pc;
    },
    [cleanupPeer, sendSignal, userId],
  );

  const connectToPeers = useCallback(async () => {
    const others = memberIdsRef.current.filter((id) => id !== userId);
    for (const peerId of others) {
      const pc = createPeer(peerId, true);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignal({
        fromUserId: userId,
        toUserId: peerId,
        type: "offer",
        payload: offer,
      });
    }
  }, [createPeer, sendSignal, userId]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await supabase.realtime.setAuth(session?.access_token ?? "");
      if (cancelled) return;

      const channel = supabase.channel(`room-webrtc:${roomId}`);

      channel
        .on("broadcast", { event: "webrtc:signal" }, async ({ payload }) => {
          const msg = payload as SignalPayload;
          if (msg.fromUserId === userId) return;
          if (msg.toUserId && msg.toUserId !== userId) return;

          if (msg.type === "screenshare-ended") {
            setRemoteStream(null);
            setSharerId(null);
            cleanupPeer(msg.fromUserId);
            return;
          }

          if (msg.type === "offer" && msg.payload) {
            const pc = createPeer(msg.fromUserId, false);
            await pc.setRemoteDescription(
              new RTCSessionDescription(
                msg.payload as RTCSessionDescriptionInit,
              ),
            );
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await sendSignal({
              fromUserId: userId,
              toUserId: msg.fromUserId,
              type: "answer",
              payload: answer,
            });
            return;
          }

          if (msg.type === "answer" && msg.payload) {
            const pc = peersRef.current.get(msg.fromUserId);
            if (pc) {
              await pc.setRemoteDescription(
                new RTCSessionDescription(
                  msg.payload as RTCSessionDescriptionInit,
                ),
              );
            }
            return;
          }

          if (msg.type === "ice-candidate" && msg.payload) {
            const pc = peersRef.current.get(msg.fromUserId);
            if (pc) {
              try {
                await pc.addIceCandidate(
                  new RTCIceCandidate(msg.payload as RTCIceCandidateInit),
                );
              } catch {
                // ignore late candidates
              }
            }
          }
        })
        .subscribe();

      channelRef.current = channel;
    })();

    return () => {
      cancelled = true;
      void stopSharing();
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
      }
      channelRef.current = null;
      setRemoteStream(null);
      setSharerId(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId]);

  /** Re-offer when new members join while already sharing/relaying */
  useEffect(() => {
    if (!sharing || !localStreamRef.current) return;
    const timer = window.setTimeout(() => {
      void connectToPeers();
    }, 800);
    return () => window.clearTimeout(timer);
  }, [memberIds.join(","), sharing, connectToPeers]);

  const startSharing = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      isRelayRef.current = false;
      setIsRelay(false);
      setSharing(true);
      setRemoteStream(null);
      setSharerId(userId);

      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        void stopSharing();
      });

      await connectToPeers();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Screen share permission denied",
      );
      setSharing(false);
    }
  }, [connectToPeers, stopSharing, userId]);

  /** Push an existing MediaStream (e.g. video.captureStream()) to other peers */
  const startRelay = useCallback(
    async (stream: MediaStream) => {
      setError(null);
      // Replace previous relay without stopping the video element's tracks
      if (localStreamRef.current && isRelayRef.current) {
        peersRef.current.forEach((pc) => pc.close());
        peersRef.current.clear();
      } else if (localStreamRef.current && !isRelayRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      localStreamRef.current = stream;
      isRelayRef.current = true;
      setIsRelay(true);
      setSharing(true);
      setRemoteStream(null);
      setSharerId(userId);
      await connectToPeers();
    },
    [connectToPeers, userId],
  );

  return {
    sharing,
    isRelay,
    remoteStream,
    sharerId,
    error,
    startSharing,
    startRelay,
    stopSharing,
  };
}
