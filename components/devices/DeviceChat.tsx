"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; role: string };
}

const ROLE_BADGE: Record<string, string> = {
  admin:      "bg-purple-500/15 text-purple-400 border-purple-500/20",
  manager:    "bg-blue-500/15 text-blue-400 border-blue-500/20",
  technician: "bg-orange-500/15 text-orange-400 border-orange-500/20",
};

const ROLE_LABEL: Record<string, string> = {
  admin:      "Admin",
  manager:    "Manager",
  technician: "Τεχνικός",
};

export function DeviceChat({ deviceId }: { deviceId: string }) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/devices/${deviceId}/messages`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setMessages)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [deviceId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput("");

    try {
      const res = await fetch(`/api/devices/${deviceId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });

      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
      } else {
        setInput(text);
      }
    } catch {
      setInput(text);
    }
    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="rounded-2xl border border-[#2E3347] bg-[#13151f] overflow-hidden flex flex-col" style={{ minHeight: 0 }}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#2E3347] shrink-0">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10">
          <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
        </div>
        <span className="text-sm font-semibold text-foreground">Επικοινωνία</span>
        {messages.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
            {messages.length}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-72">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <MessageSquare className="h-7 w-7 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground/50">Δεν υπάρχουν μηνύματα ακόμη</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.user.id === currentUserId;
            return (
              <div
                key={msg.id}
                className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}
              >
                {/* Sender label */}
                <div className={cn("flex items-center gap-1.5", isOwn && "flex-row-reverse")}>
                  <div className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                    isOwn ? "bg-primary/20 text-primary" : "bg-white/10 text-muted-foreground"
                  )}>
                    {msg.user.name[0].toUpperCase()}
                  </div>
                  <span className="text-[11px] font-medium text-foreground/70">{msg.user.name}</span>
                  <span className={cn(
                    "text-[9px] font-medium border rounded-full px-1.5 py-0",
                    ROLE_BADGE[msg.user.role] ?? "bg-white/5 text-muted-foreground border-white/10"
                  )}>
                    {ROLE_LABEL[msg.user.role] ?? msg.user.role}
                  </span>
                </div>

                {/* Bubble */}
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                  isOwn
                    ? "rounded-tr-sm bg-primary text-primary-foreground"
                    : "rounded-tl-sm bg-[#1e2130] border border-[#2E3347] text-foreground"
                )}>
                  {msg.content}
                </div>

                {/* Time */}
                <span className="text-[10px] text-muted-foreground/40 px-1">
                  {formatDateTime(msg.createdAt)}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-[#2E3347] px-3 py-2.5 flex items-center gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Γράψτε μήνυμα... (Enter για αποστολή)"
          className="flex-1 bg-[#0F1117] border border-[#2E3347] rounded-xl px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
          maxLength={1000}
          disabled={sending}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {sending
            ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-foreground" />
            : <Send className="h-3.5 w-3.5 text-primary-foreground" />}
        </button>
      </div>
    </div>
  );
}
