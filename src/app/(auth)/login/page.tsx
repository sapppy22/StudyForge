import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser, isGuestUser } from "@/lib/session";
import { enabledOAuthProviders, isGuestModeEnabled } from "@/lib/env";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const callbackErrors: Record<string, string> = {
  callback_failed:
    "We couldn't complete that sign-in. The link may have expired — try again.",
  access_denied: "Sign-in was cancelled.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  const user = await getSessionUser();
  const guest = isGuestUser(user);

  // Already signed in for real — skip the form. Guests stay: this page is how
  // they turn a guest session into an account.
  if (user && !guest) redirect("/dashboard");

  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return (
    <LoginForm
      next={safeNext}
      guestSession={guest}
      guestEnabled={isGuestModeEnabled()}
      oauthProviders={enabledOAuthProviders()}
      initialError={
        error ? (callbackErrors[error] ?? callbackErrors.callback_failed) : undefined
      }
    />
  );
}
