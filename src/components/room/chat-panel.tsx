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
    <div className="flex h-full min-h-[420px] flex-col border border-cream/10 bg-ink-900/80 lg:min-h-[480px]">
      <div className="border-b border-cream/10 px-4 py-3">
        <h2 className="font-display text-lg tracking-wide text-cream">Live chat</h2>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="text-sm text-cream/40">Say hi — messages stick around in history.</p>
        )}
        {messages.map((m, i) => {
          const mine = m.userId === currentUserId;
          return (
            <div
              key={m.id ?? `${m.createdAt}-${i}`}
              className={cn("flex flex-col gap-0.5", mine ? "items-end" : "items-start")}
            >
              <span className="text-[11px] uppercase tracking-wider text-cream/40">
                {m.username ?? "viewer"}
              </span>
              <div
                className={cn(
                  "max-w-[85%] px-3 py-2 text-sm leading-relaxed",
                  mine
                    ? "bg-amber-500 text-ink-950"
                    : "bg-cream/10 text-cream",
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
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-cream/10 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message the room…"
          className="flex-1 border border-cream/15 bg-ink-950 px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:border-amber-500/60 focus:outline-none"
          maxLength={1000}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="bg-amber-500 px-4 py-2 text-sm font-medium text-ink-950 transition hover:bg-amber-400 disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
