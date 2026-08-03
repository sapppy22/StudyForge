"use client";

import { useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { TriangleAlert } from "lucide-react";

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
      title="Something went wrong"
      description="An unexpected error occurred while loading this page. You can retry or head back to your dashboard."
      className="h-[60vh]"
    >
      <Button onClick={reset}>Try again</Button>
      <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }))}>
        Dashboard
      </Link>
    </EmptyState>
  );
}
