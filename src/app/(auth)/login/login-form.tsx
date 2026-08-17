"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldError, FormMessage } from "@/components/auth/form-message";
import {
  signIn,
  signUp,
  requestPasswordReset,
  signInWithOAuth,
  continueAsGuest,
} from "@/services/auth/auth";
import type { OAuthProvider } from "@/lib/env";
import { Loader2, UserRound } from "lucide-react";

type Mode = "signin" | "signup" | "forgot";

const copy: Record<Mode, { title: string; description: string; cta: string }> = {
  signin: {
    title: "Welcome back",
    description: "Sign in to pick up where you left off.",
    cta: "Sign in",
  },
  signup: {
    title: "Create your account",
    description: "Your adaptive exam-prep workspace.",
    cta: "Create account",
  },
  forgot: {
    title: "Reset your password",
    description: "We'll email you a link to choose a new one.",
    cta: "Send reset link",
  },
};

const providerLabels: Record<OAuthProvider, string> = {
  google: "Google",
  github: "GitHub",
};

export function LoginForm({
  next,
  initialError,
  guestEnabled,
  guestSession,
  oauthProviders,
}: {
  next: string;
  initialError?: string;
  /** Whether to offer "continue as guest". */
  guestEnabled: boolean;
  /** Whether the visitor is *currently* browsing as a guest. */
  guestSession: boolean;
  oauthProviders: OAuthProvider[];
}) {
  // A guest landing here is trying to keep their work, so open on sign-up.
  const [mode, setMode] = useState<Mode>(guestSession ? "signup" : "signin");
  const [actionError, setActionError] = useState<string | null>(
    initialError ?? null
  );
  const [oauthPending, startOAuth] = useTransition();
  const [guestPending, startGuest] = useTransition();

  // One state slot per action keeps each form's errors independent, and keeps
  // the hook count stable across mode switches.
  const [signInState, signInAction, signInPending] = useActionState(
    signIn,
    undefined
  );
  const [signUpState, signUpAction, signUpPending] = useActionState(
    signUp,
    undefined
  );
  const [resetState, resetAction, resetPending] = useActionState(
    requestPasswordReset,
    undefined
  );

  const state =
    mode === "signin" ? signInState : mode === "signup" ? signUpState : resetState;
  const action =
    mode === "signin" ? signInAction : mode === "signup" ? signUpAction : resetAction;
  const pending =
    mode === "signin" ? signInPending : mode === "signup" ? signUpPending : resetPending;

  const errors = state?.errors ?? {};
  const { title, description, cta } = copy[mode];
  const busy = pending || oauthPending || guestPending;

  function oauth(provider: OAuthProvider) {
    setActionError(null);
    startOAuth(async () => {
      // Resolves only on failure — success redirects to the provider.
      const result = await signInWithOAuth(provider, next);
      if (result?.message) setActionError(result.message);
    });
  }

  function guest() {
    setActionError(null);
    startGuest(async () => {
      // Resolves only on failure — success redirects into the app.
      const result = await continueAsGuest(next);
      if (result?.message) setActionError(result.message);
    });
  }

  function switchTo(nextMode: Mode) {
    setMode(nextMode);
    setActionError(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          {guestSession && mode === "signup" ? "Save your progress" : title}
        </CardTitle>
        <CardDescription>
          {guestSession && mode === "signup"
            ? "Create an account and everything you've done as a guest comes with you."
            : description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* `key` remounts the form on mode switch so stale values don't carry over. */}
        <form key={mode} action={action} className="space-y-4">
          <input type="hidden" name="next" value={next} />

          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Your name"
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
                required
              />
              <FieldError errors={errors.name} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              required
            />
            <FieldError errors={errors.email} />
          </div>

          {mode !== "forgot" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => switchTo("forgot")}
                    className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                aria-invalid={Boolean(errors.password)}
                required
              />
              <FieldError errors={errors.password} />
              {mode === "signup" && !errors.password && (
                <p className="text-xs text-muted-foreground">
                  At least 8 characters, with a letter and a number.
                </p>
              )}
            </div>
          )}

          <FormMessage state={state} />
          {actionError && (
            <FormMessage state={{ message: actionError, status: "error" }} />
          )}

          <Button type="submit" className="w-full" disabled={busy}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {cta}
          </Button>
        </form>

        {mode !== "forgot" && (oauthProviders.length > 0 || guestEnabled) && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            {oauthProviders.length > 0 && (
              <div
                className={
                  oauthProviders.length > 1 ? "grid grid-cols-2 gap-2" : "grid gap-2"
                }
              >
                {oauthProviders.map((provider) => (
                  <Button
                    key={provider}
                    variant="outline"
                    type="button"
                    disabled={busy}
                    onClick={() => oauth(provider)}
                  >
                    {providerLabels[provider]}
                  </Button>
                ))}
              </div>
            )}

            {guestEnabled && !guestSession && (
              <div className="space-y-1.5">
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  disabled={busy}
                  onClick={guest}
                >
                  {guestPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <UserRound className="size-4" />
                  )}
                  Continue as guest
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Full access, no email needed. Sign up later to keep your progress.
                </p>
              </div>
            )}

            {guestSession && (
              <Link
                href="/dashboard"
                className="block text-center text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Keep browsing as a guest
              </Link>
            )}
          </>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {mode === "signin" && (
            <>
              Don&apos;t have an account?{" "}
              <SwitchLink onClick={() => switchTo("signup")}>Sign up</SwitchLink>
            </>
          )}
          {mode === "signup" && (
            <>
              Already have an account?{" "}
              <SwitchLink onClick={() => switchTo("signin")}>Sign in</SwitchLink>
            </>
          )}
          {mode === "forgot" && (
            <>
              Remembered it?{" "}
              <SwitchLink onClick={() => switchTo("signin")}>
                Back to sign in
              </SwitchLink>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

function SwitchLink({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-medium text-foreground underline underline-offset-4"
    >
      {children}
    </button>
  );
}
