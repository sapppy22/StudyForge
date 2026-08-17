import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";

/**
 * Guest sessions — using StudyForge without an account.
 *
 * Supabase owns real accounts; a guest is a *local* identity issued by this app
 * and carried in a signed, http-only cookie. The cookie holds nothing but a
 * random id, an issue timestamp and an HMAC over the two, so it can be verified
 * without a database round-trip (which matters in `proxy.ts`, on every request).
 *
 * A guest gets a real `profiles` row keyed by that id, which is why every
 * feature — goals, tests, flashcards, analytics — works identically to a signed
 * in user with no branching in the services. Guest ids carry a `guest_` prefix
 * so they can never collide with a Supabase UUID, and when a guest later signs
 * up their row is re-keyed onto the real auth id (see `claimGuestProfile`),
 * carrying all their work across.
 *
 * This module is server-only: it touches `node:crypto` and `next/headers`.
 */

export const GUEST_COOKIE = "sf_guest";

/** Guests stay signed in for 30 days, enforced on both sides of the cookie. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const GUEST_ID_PREFIX = "guest_";
const GUEST_EMAIL_DOMAIN = "guest.studyforge.local";

/**
 * Signing key for guest cookies.
 *
 * `GUEST_SESSION_SECRET` is the supported way to set this. Without it we derive
 * a stable key from server-only configuration so that a deployment that never
 * sets the variable still gets signed (not forgeable) cookies rather than
 * silently trusting whatever the browser sends.
 */
function signingKey(): string {
  const explicit = process.env.GUEST_SESSION_SECRET;
  if (explicit) return explicit;

  return createHash("sha256")
    .update("studyforge:guest-session:")
    .update(process.env.DATABASE_URL ?? "")
    .update(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
    .digest("hex");
}

function sign(payload: string): string {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

/** True for ids minted by this module — the guest/real-account discriminator. */
export function isGuestId(id: string | null | undefined): boolean {
  return Boolean(id?.startsWith(GUEST_ID_PREFIX));
}

export function newGuestId(): string {
  return GUEST_ID_PREFIX + randomUUID();
}

export function guestEmail(id: string): string {
  return `${id}@${GUEST_EMAIL_DOMAIN}`;
}

/**
 * True for the placeholder address on a guest profile. Nothing can be delivered
 * there, so the email dispatcher keeps such reports in-app only.
 */
export function isGuestEmail(email: string | null | undefined): boolean {
  return Boolean(email?.endsWith(`@${GUEST_EMAIL_DOMAIN}`));
}

/** `<id>.<issuedAtSeconds>.<hmac>` */
function createToken(id: string): string {
  const payload = `${id}.${Math.floor(Date.now() / 1000)}`;
  return `${payload}.${sign(payload)}`;
}

/**
 * Verifies a guest cookie and returns the guest id, or null when the token is
 * malformed, forged or older than the maximum session age.
 */
export function verifyGuestToken(token: string | undefined | null): string | null {
  if (!token) return null;

  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return null;

  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);

  const expected = sign(payload);
  // Both are base64url of a SHA-256 digest, so lengths match for any honest
  // token; the length guard keeps timingSafeEqual from throwing on junk input.
  if (signature.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  const [id, issuedAt] = payload.split(".");
  if (!isGuestId(id)) return null;

  const issued = Number(issuedAt);
  if (!Number.isFinite(issued)) return null;
  if (Date.now() / 1000 - issued > MAX_AGE_SECONDS) return null;

  return id;
}

/** Reads the guest id from the request cookies (Server Component / handler). */
export async function readGuestId(): Promise<string | null> {
  const store = await cookies();
  return verifyGuestToken(store.get(GUEST_COOKIE)?.value);
}

/**
 * Issues a guest session cookie, reusing the existing id when one is already
 * present so a repeat click never orphans the work done under the old id.
 * Only callable where cookies are writable: a Server Action or Route Handler.
 */
export async function startGuestSession(): Promise<string> {
  const store = await cookies();
  const id = verifyGuestToken(store.get(GUEST_COOKIE)?.value) ?? newGuestId();

  store.set(GUEST_COOKIE, createToken(id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });

  return id;
}

/** Clears the guest cookie (sign-out, or promotion to a real account). */
export async function endGuestSession(): Promise<void> {
  const store = await cookies();
  store.set(GUEST_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Presents a guest as a Supabase `User` so pages, route handlers and services
 * consume one shape. `is_anonymous` is Supabase's own flag for account-less
 * users, which makes it the natural discriminator for the UI to branch on.
 */
export function guestUser(id: string): User {
  return {
    id,
    aud: "authenticated",
    role: "authenticated",
    email: guestEmail(id),
    app_metadata: { provider: "guest", providers: ["guest"] },
    user_metadata: { name: "Guest" },
    created_at: new Date(0).toISOString(),
    is_anonymous: true,
  };
}
