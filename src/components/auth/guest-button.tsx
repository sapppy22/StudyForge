"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { continueAsGuest } from "@/services/auth/auth";
import { Loader2, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * "Continue as guest" entry point, usable anywhere an unauthenticated visitor
 * can be dropped into the app. The action redirects on success, so this only
 * ever renders an error when guest mode is off or the database is unreachable.
 */
export function GuestButton({
  next = "/dashboard",
  label = "Continue as guest",
  className,
  variant = "outline",
  size = "default",
}: {
  next?: string;
  label?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn(className)}
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const result = await continueAsGuest(next);
            if (result?.message) setError(result.message);
          })
        }
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <UserRound className="size-4" />
        )}
        {label}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
