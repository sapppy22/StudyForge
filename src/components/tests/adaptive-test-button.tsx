"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

export function AdaptiveTestButton({
  goalId,
  variant = "default",
  size = "default",
  className,
  label = "Generate adaptive test",
}: {
  goalId: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const res = await fetch("/api/tests/adaptive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate test");
      }
      const test = await res.json();
      toast.success("Adaptive test ready");
      router.push(`/tests/${test.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate test");
      setLoading(false);
    }
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={run} disabled={loading}>
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Sparkles className="size-4" />
      )}
      {label}
    </Button>
  );
}
