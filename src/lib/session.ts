import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/db/prisma";
import {
  endGuestSession,
  guestEmail,
  guestUser,
  isGuestId,
  readGuestId,
} from "@/lib/guest";

/**
 * Auth + profile helpers shared by pages and route handlers.
 *
 * Supabase owns authentication; Prisma owns the application tables. Every
 * application row (goals, content, tests, …) has a foreign key onto
 * `profiles.id`, which must equal the Supabase auth user id. `ensureProfile`
 * guarantees that row exists before any dependent write, closing the gap where
 * a user authenticated through a flow that never created their profile row.
 *
 * Guests (see `lib/guest.ts`) are surfaced through the same `User` shape with
 * `is_anonymous: true`, so nothing downstream has to know the difference.
 */

/** True for the account-less local identity issued by guest mode. */
export function isGuestUser(user: User | null | undefined): boolean {
  return Boolean(user && (user.is_anonymous || isGuestId(user.id)));
}

/**
 * Returns the current user, or null. Read-only, no DB writes.
 *
 * A real Supabase session always wins over a lingering guest cookie.
 */
export async function getSessionUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) return user;
  } catch {
    // Supabase not configured / unreachable — fall through to guest mode so
    // routes return 401 (and pages redirect to /login) rather than 500.
  }

  const guestId = await readGuestId();
  return guestId ? guestUser(guestId) : null;
}

/** Upserts the Prisma profile row for a user (idempotent). */
export async function ensureProfile(user: User) {
  const guest = isGuestUser(user);
  const email = user.email ?? (guest ? guestEmail(user.id) : `${user.id}@studyforge.local`);
  const name =
    (user.user_metadata?.name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    (guest ? "Guest" : user.email?.split("@")[0]) ??
    null;
  const avatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ??
    (user.user_metadata?.picture as string | undefined) ??
    null;

  return prisma.profile.upsert({
    where: { id: user.id },
    update: { email },
    create: { id: user.id, email, name, avatarUrl },
  });
}

/**
 * Promotes the work done in a guest session onto a real account.
 *
 * Every child table references `profiles(id)` with `ON UPDATE CASCADE`, so
 * re-keying the guest profile row onto the Supabase auth id moves the guest's
 * goals, notes, tests, flashcards and analytics across in one statement.
 *
 * Called on every authenticated entry point (sign-in, sign-up with an immediate
 * session, and the OAuth / email-confirmation callback) and always clears the
 * guest cookie, so a guest cookie can never outlive the promotion.
 *
 * When the account already has a profile — a returning user who happened to be
 * browsing as a guest — nothing is merged: the guest rows are left untouched
 * rather than risking a collision or clobbering existing data.
 *
 * @returns whether guest data was carried over.
 */
export async function claimGuestProfile(user: User): Promise<boolean> {
  const guestId = await readGuestId();
  if (!guestId || isGuestUser(user)) return false;

  await endGuestSession();

  const [guestProfile, existing] = await Promise.all([
    prisma.profile.findUnique({ where: { id: guestId } }),
    prisma.profile.findUnique({ where: { id: user.id } }),
  ]);

  if (!guestProfile || existing) return false;

  const email = user.email ?? `${user.id}@studyforge.local`;
  const emailOwner = await prisma.profile.findUnique({ where: { email } });
  if (emailOwner) return false;

  await prisma.profile.update({
    where: { id: guestId },
    data: {
      id: user.id,
      email,
      name:
        (user.user_metadata?.name as string | undefined) ??
        guestProfile.name ??
        user.email?.split("@")[0] ??
        null,
    },
  });

  return true;
}

/**
 * For Server Components / pages: returns the user (redirecting to /login when
 * unauthenticated) and guarantees their profile row exists.
 */
export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  await ensureProfile(user);
  return user;
}

/**
 * For Route Handlers: returns the user and ensures their profile exists, or
 * null when unauthenticated (the caller returns 401). Never redirects.
 */
export async function getApiUser(): Promise<User | null> {
  const user = await getSessionUser();
  if (!user) return null;
  await ensureProfile(user);
  return user;
}
