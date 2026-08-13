import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
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

  // Already signed in — skip the form.
  if (await getSessionUser()) redirect("/dashboard");

  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return (
    <LoginForm
      next={safeNext}
      initialError={error ? (callbackErrors[error] ?? callbackErrors.callback_failed) : undefined}
    />
  );
}
