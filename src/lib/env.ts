/**
 * Centralised access to environment configuration.
 *
 * Server-only secrets (DATABASE_URL, ANTHROPIC_API_KEY, GUEST_SESSION_SECRET)
 * are read directly from `process.env` where needed. This module exposes the
 * small set of values that are consumed in more than one place, plus a couple of
 * derived flags.
 *
 * Every `process.env.NEXT_PUBLIC_*` lookup here is written out literally rather
 * than computed, because Next.js inlines those at build time by static analysis.
 */

/** Public base URL of the app, used for building absolute OAuth redirect URLs. */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

/**
 * Whether Claude-powered features are configured. When false, the AI services
 * degrade gracefully to deterministic offline generators so the product still
 * functions end-to-end. Evaluated lazily so tests / previews without a key work.
 */
export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * The public Supabase API key.
 *
 * Supabase is migrating from JWT `anon` keys to `sb_publishable_…` keys; both
 * are safe to expose to the browser and both are accepted in the same position
 * by `@supabase/supabase-js`. The newer publishable key wins when both are set,
 * so a project that has rotated forward gets the current credential.
 */
export function supabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  );
}

/** The Supabase project URL. */
export function supabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

/** Whether Supabase auth is configured. */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseAnonKey());
}

/**
 * Whether "continue as guest" is offered. On by default — it is the fastest way
 * into the product — and set `NEXT_PUBLIC_ENABLE_GUEST_MODE=false` to require
 * an account.
 */
export function isGuestModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_GUEST_MODE !== "false";
}

export type OAuthProvider = "google" | "github";

const SUPPORTED_OAUTH: OAuthProvider[] = ["google", "github"];

/**
 * Social providers to offer on the login screen.
 *
 * A provider that isn't enabled in the Supabase dashboard fails at the point of
 * redirect, so the buttons are opt-in via
 * `NEXT_PUBLIC_OAUTH_PROVIDERS="google,github"` rather than always shown. Unset
 * means email/password (and guest) only.
 */
export function enabledOAuthProviders(): OAuthProvider[] {
  const raw = process.env.NEXT_PUBLIC_OAUTH_PROVIDERS ?? "";
  const requested = raw
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);

  return SUPPORTED_OAUTH.filter((p) => requested.includes(p));
}
