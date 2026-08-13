"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Send } from "lucide-react";

export function EmailDigestSettings({ userEmail }: { userEmail: string }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSendSampleDigest() {
    setSending(true);
    try {
      const res = await fetch("/api/email/sample-digest", {
        method: "POST",
      });
      if (res.ok) {
        setSent(true);
      }
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium">Performance Reports & Digests</p>
        <p className="text-xs text-muted-foreground">
          Delivered to <span className="font-mono text-foreground">{userEmail}</span> after mock exams, weekly quizzes, and syllabus milestones.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSendSampleDigest}
        disabled={sending || sent}
        className="shrink-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs"
      >
        {sending ? (
          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
        ) : sent ? (
          <Check className="mr-1.5 size-3.5 text-emerald-500" />
        ) : (
          <Send className="mr-1.5 size-3.5" />
        )}
        {sent ? "Sample Digest Sent!" : "Send Test Digest"}
      </Button>
    </div>
  );
}
