"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Plus, MessageSquare, BookText, Sparkles } from "lucide-react";

interface Session {
  id: string;
  title: string | null;
  topic?: { title: string } | null;
}
interface Message {
  id?: string;
  role: string;
  content: string;
  sources?: { id: string; title: string }[] | null;
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then(async (data: Session[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setSessions(data);
          setSessionId(data[0].id);
        } else {
          const session = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "create", title: "New chat" }),
          }).then((r) => r.json());
          setSessions([session]);
          setSessionId(session.id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/chat/messages?sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function newSession() {
    const session = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", title: "New chat" }),
    }).then((r) => r.json());
    setSessions((s) => [session, ...s]);
    setSessionId(session.id);
    setMessages([]);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || !sessionId || sending) return;
    setSending(true);
    setInput("");
    setMessages((m) => [
      ...m,
      { role: "user", content },
      { role: "assistant", content: "" },
    ]);

    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, content }),
      });
      if (!res.ok || !res.body) throw new Error("stream failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last && last.role === "assistant") {
            copy[copy.length - 1] = { ...last, content: acc };
          }
          return copy;
        });
      }
    } catch {
      setMessages((m) => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        if (last && last.role === "assistant") {
          copy[copy.length - 1] = {
            ...last,
            content: "Sorry — something went wrong. Please try again.",
          };
        }
        return copy;
      });
    } finally {
      setSending(false);
      // Sync canonical messages (ids + grounding sources).
      fetch(`/api/chat/messages?sessionId=${sessionId}`)
        .then((r) => r.json())
        .then((data) => Array.isArray(data) && setMessages(data))
        .catch(() => {});
    }
  }

  const activeSession = sessions.find((s) => s.id === sessionId);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      <aside className="hidden w-56 shrink-0 flex-col gap-2 md:flex">
        <Button variant="outline" className="w-full justify-start" onClick={newSession}>
          <Plus className="size-4" /> New chat
        </Button>
        <ScrollArea className="flex-1">
          <div className="space-y-1 pr-2">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setSessionId(s.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  s.id === sessionId
                    ? "bg-muted font-medium"
                    : "text-muted-foreground hover:bg-muted/60"
                )}
              >
                <MessageSquare className="size-3.5 shrink-0" />
                <span className="truncate">{s.title || "Chat"}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col rounded-xl bg-card ring-1 ring-foreground/10">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-none">StudyForge Tutor</p>
            {activeSession?.topic?.title && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <BookText className="size-3" /> Grounded in{" "}
                {activeSession.topic.title}
              </p>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
                <MessageSquare className="size-8 opacity-40" />
                Ask a doubt to get started. Answers are grounded in your notes.
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={m.id ?? i}
                className={cn(
                  "flex",
                  m.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="whitespace-pre-wrap">
                    {m.content ||
                      (m.role === "assistant" && sending ? "…" : "")}
                  </p>
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 border-t border-border/50 pt-2">
                      {m.sources.map((src) => (
                        <span
                          key={src.id}
                          className="inline-flex items-center gap-1 rounded-full bg-background/60 px-2 py-0.5 text-[11px] text-muted-foreground"
                        >
                          <BookText className="size-3" /> {src.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <form onSubmit={send} className="flex gap-2 border-t p-3">
          <Input
            placeholder="Ask a doubt…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
          />
          <Button type="submit" size="icon" disabled={sending || !input.trim()}>
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
