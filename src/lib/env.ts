/**
 * Centralised access to environment configuration.
 *
 * Server-only secrets (DATABASE_URL, ANTHROPIC_API_KEY) are read directly from
 * `process.env` where needed. This module exposes the small set of values that
 * are consumed in more than one place, plus a couple of derived flags.
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

/** Whether Supabase auth is configured. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  );
}
