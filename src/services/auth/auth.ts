"use server";

import { redirect } from "next/navigation";
import * as z from "zod";
import { createClient } from "@/lib/supabase/server";
import { claimGuestProfile, ensureProfile } from "@/lib/session";
import { isDatabaseAuthFailure, isDatabaseUnreachable } from "@/lib/errors";
import {
  APP_URL,
  enabledOAuthProviders,
  isGuestModeEnabled,
  isSupabaseConfigured,
  type OAuthProvider,
} from "@/lib/env";
import { endGuestSession, guestUser, startGuestSession } from "@/lib/guest";
import {
  SignInSchema,
  SignUpSchema,
  ResetRequestSchema,
  NewPasswordSchema,
  type AuthFormState,
} from "@/lib/validation/auth";

/**
 * Authentication Server Actions.
 *
 * Every action takes the `(prevState, formData)` signature so the login form can
 * drive them with `useActionState`, and returns `AuthFormState` — either
 * per-field errors from Zod or a single banner message. Successful sign-in
 * calls `redirect()`, which throws, so it always sits *outside* a try/catch.
 */

const NOT_CONFIGURED =
  "Authentication is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your environment.";

function fail(message: string): AuthFormState {
  return { message, status: "error" };
}

/**
 * Supabase surfaces raw provider errors; translate the ones users actually hit
 * into something actionable and keep the rest verbatim.
 */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "That email and password combination doesn't match an account.";
  if (m.includes("email not confirmed"))
    return "Confirm your email address first — check your inbox for the link.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "An account with this email already exists. Sign in instead.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Too many attempts. Wait a minute and try again.";
  if (m.includes("password should be"))
    return "That password was rejected: " + message;
  return message;
}

/**
 * Why a guest session could not be started, in words that name the thing to go
 * and fix. Uses the shared database classifiers so this and the API error
 * translator always agree about what a given failure means.
 */
function guestSetupError(error: unknown): string {
  if (isDatabaseAuthFailure(error)) {
    return "Couldn't start a guest session — the database rejected its credentials. Check the password in DATABASE_URL.";
  }
  if (isDatabaseUnreachable(error)) {
    return "Couldn't start a guest session — the database is unreachable. Try again in a moment.";
  }

  const code = (error as { code?: unknown } | null)?.code;
  if (code === "P2021" || code === "P2022") {
    return "Couldn't start a guest session — the database schema is out of date. Run the Prisma migrations.";
  }

  return "Couldn't start a guest session. Check the server logs for the underlying error.";
}

/** Only allow same-origin relative paths as post-login destinations. */
function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return fail(NOT_CONFIGURED);

  const parsed = SignInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, status: "error" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) return fail(friendlyAuthError(error.message));
  if (!data.user) return fail("Sign-in failed. Try again.");

  // Carry any guest-session work onto this account, then guarantee the Prisma
  // profile row exists — every application table has a foreign key onto it,
  // including for users created outside this flow.
  await claimGuestProfile(data.user);
  await ensureProfile(data.user);

  redirect(safeNext(formData.get("next") as string | null));
}

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return fail(NOT_CONFIGURED);

  const parsed = SignUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, status: "error" };
  }

  const { name, email, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${APP_URL}/api/auth/callback`,
    },
  });

  if (error) return fail(friendlyAuthError(error.message));

  // Supabase returns a user with an empty `identities` array when the address is
  // already registered and confirmation emails are on — it deliberately doesn't
  // error, to avoid leaking which addresses exist. Mirror that ambiguity.
  if (data.user && data.user.identities?.length === 0) {
    return {
      message:
        "If that email is available you'll receive a confirmation link. Otherwise, sign in with your existing password.",
      status: "success",
    };
  }

  // No session means email confirmation is required. Both the profile row and
  // any guest promotion wait for /api/auth/callback (which the confirmation
  // link routes through): an unconfirmed user can't write anything, and until
  // they confirm, guest work has to stay reachable under the guest id.
  if (!data.session) {
    return {
      message: `Almost there — confirm your email at ${email}, then sign in.`,
      status: "success",
    };
  }

  if (data.user) {
    await claimGuestProfile(data.user);
    await ensureProfile(data.user);
  }

  redirect(safeNext(formData.get("next") as string | null));
}

export async function requestPasswordReset(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return fail(NOT_CONFIGURED);

  const parsed = ResetRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, status: "error" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${APP_URL}/api/auth/callback?next=/reset-password`,
  });

  // Never confirm whether the address exists.
  if (error && !/user not found/i.test(error.message)) {
    return fail(friendlyAuthError(error.message));
  }

  return {
    message: "If an account exists for that email, a reset link is on its way.",
    status: "success",
  };
}

/** Completes a reset: requires the recovery session created by the callback. */
export async function updatePassword(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return fail(NOT_CONFIGURED);

  const parsed = NewPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, status: "error" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return fail("This reset link has expired. Request a new one.");
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) return fail(friendlyAuthError(error.message));

  redirect("/dashboard");
}

/**
 * Starts (or resumes) a guest session and drops the user straight into the app.
 *
 * No Supabase round-trip: the identity is a signed cookie plus a `profiles` row,
 * so guest mode works even when Supabase is unconfigured or unreachable. Signing
 * up later promotes the same row, so nothing done as a guest is lost.
 */
export async function continueAsGuest(next?: string): Promise<AuthFormState> {
  if (!isGuestModeEnabled()) {
    return fail("Guest access is disabled. Create an account to continue.");
  }

  let id: string;
  try {
    id = await startGuestSession();
    await ensureProfile(guestUser(id));
  } catch (error) {
    // The profile upsert is the only database write in this path, so a failure
    // here is nearly always deployment configuration rather than anything the
    // visitor did. Log the underlying error: without it every misconfiguration
    // reaches the user as the same unhelpful banner.
    console.error("[guest] could not start session:", error);
    return fail(guestSetupError(error));
  }

  redirect(safeNext(next));
}

export async function signInWithOAuth(provider: OAuthProvider, next?: string) {
  if (!isSupabaseConfigured()) return fail(NOT_CONFIGURED);

  // The provider also has to be turned on in the Supabase dashboard; the env
  // allowlist is what keeps the UI from offering a button that dead-ends.
  if (!enabledOAuthProviders().includes(provider)) {
    return fail(`${provider} sign-in isn't enabled for this deployment.`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${APP_URL}/api/auth/callback?next=${encodeURIComponent(safeNext(next))}`,
    },
  });

  if (error) return fail(friendlyAuthError(error.message));
  if (!data.url) return fail("Could not start the sign-in flow. Try again.");

  redirect(data.url);
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  // Guest work stays in the database — the cookie is what's dropped, so signing
  // out of guest mode is reversible only via sign-up (which is the point of the
  // "save your progress" prompts).
  await endGuestSession();
  redirect("/login");
}
