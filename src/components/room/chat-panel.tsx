"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { ChatMsg } from "@/hooks/use-room-channel";
import { cn } from "@/lib/utils";

type ChatPanelProps = {
  messages: ChatMsg[];
  currentUserId: string;
  onSend: (content: string) => Promise<void>;
};

export function ChatPanel({ messages, currentUserId, onSend }: ChatPanelProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText("");
    try {
      await onSend(content);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="glass-card flex h-full min-h-[380px] flex-col overflow-hidden rounded-2xl lg:min-h-[420px]">
      <div className="border-b border-white/[0.06] px-4 py-3">
        <h2 className="font-display text-base font-bold tracking-tight">
          Whisper row
        </h2>
        <p className="text-[11px] text-mist">Reactions land here</p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="text-sm text-mist">
            Say hi — messages stick around in history.
          </p>
        )}
        {messages.map((m, i) => {
          const mine = m.userId === currentUserId;
          return (
            <div
              key={m.id ?? `${m.createdAt}-${i}`}
              className={cn(
                "flex flex-col gap-0.5",
                mine ? "items-end" : "items-start",
              )}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-mist/70">
                {m.username ?? "viewer"}
              </span>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  mine
                    ? "rounded-tr-md bg-mint/20 text-pearl"
                    : "rounded-tl-md bg-panel-lift text-pearl",
                )}
              >
                {m.content}
                {m.reaction && (
                  <span className="ml-2 text-base">{m.reaction}</span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-white/[0.06] p-3"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message the room…"
          className="flex-1 rounded-full border border-white/[0.08] bg-void/50 px-4 py-2 text-sm text-pearl placeholder:text-mist/50 focus:border-mint/40 focus:outline-none"
          maxLength={1000}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="btn-cinema rounded-full px-4 py-2 text-sm disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
