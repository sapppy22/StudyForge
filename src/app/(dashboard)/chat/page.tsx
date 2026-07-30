"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send } from "lucide-react";

export default function ChatPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((data) => {
        setSessions(data);
        if (data[0]) {
          setSessionId(data[0].id);
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/chat/messages?sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((data) => setMessages(data));
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !sessionId) return;
    setSending(true);
    setMessages((m) => [...m, { role: "user", content: input }]);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, content: input }),
    });
    const msg = await res.json();
    setMessages((m) => [...m, msg]);
    setInput("");
    setSending(false);
  }

  async function newSession() {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", title: "New chat" }),
    });
    const session = await res.json();
    setSessions((s) => [session, ...s]);
    setSessionId(session.id);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <aside className="hidden w-56 flex-col gap-2 md:flex">
        <Button variant="outline" className="w-full" onClick={newSession}>
          New chat
        </Button>
        <ScrollArea className="flex-1">
          <div className="space-y-1 pr-2">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setSessionId(s.id)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                  s.id === sessionId ? "bg-[#F7F7F5] font-medium" : "hover:bg-[#F7F7F5]/50"
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      <Card className="flex flex-1 flex-col border-none shadow-sm">
        <CardContent className="flex flex-1 flex-col p-4">
          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                    m.role === "user" ? "ml-auto bg-indigo-600 text-white" : "bg-[#F7F7F5]"
                  }`}
                >
                  {m.content}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
          <form onSubmit={send} className="mt-4 flex gap-2">
            <Input
              placeholder="Ask a doubt..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button type="submit" disabled={sending}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
