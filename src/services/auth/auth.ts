"use server";

import { redirect } from "next/navigation";
import * as z from "zod";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/session";
import { APP_URL, isSupabaseConfigured } from "@/lib/env";
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
  "Authentication is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.";

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

  // Guarantee the Prisma profile row exists — every application table has a
  // foreign key onto it, including for users created outside this flow.
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

  if (data.user) await ensureProfile(data.user);

  // No session means email confirmation is required.
  if (!data.session) {
    return {
      message: `Almost there — confirm your email at ${email}, then sign in.`,
      status: "success",
    };
  }

  redirect("/dashboard");
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

export async function signInWithOAuth(provider: "google" | "github") {
  if (!isSupabaseConfigured()) return fail(NOT_CONFIGURED);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${APP_URL}/api/auth/callback` },
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
  redirect("/login");
}
