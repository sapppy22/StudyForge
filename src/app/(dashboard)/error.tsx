"use client";

import { useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { TriangleAlert } from "lucide-react";

/**
 * Renders inside the dashboard shell, so the sidebar and header stay usable and
 * the user can navigate away instead of being stranded.
 *
 * Next scrubs server error messages before they reach the client, so this
 * cannot say *what* broke — only the digest, which is what makes a report
 * actionable when someone sends a screenshot.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      icon={TriangleAlert}
      title="This page couldn't load"
      description="The data behind this screen didn't come back. It's usually temporary — retry, or use another section in the meantime."
      className="h-[60vh]"
    >
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Back to dashboard
        </Link>
      </div>
      {error.digest && (
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          Reference: {error.digest}
        </p>
      )}
    </EmptyState>
  );
}
