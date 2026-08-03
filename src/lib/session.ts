import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/db/prisma";

/**
 * Auth + profile helpers shared by pages and route handlers.
 *
 * Supabase owns authentication; Prisma owns the application tables. Every
 * application row (goals, content, tests, …) has a foreign key onto
 * `profiles.id`, which must equal the Supabase auth user id. `ensureProfile`
 * guarantees that row exists before any dependent write, closing the gap where
 * a user authenticated through a flow that never created their profile row.
 */

/** Returns the current Supabase user, or null. Read-only, no DB writes. */
export async function getSessionUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    // Supabase not configured / unreachable — treat as unauthenticated so
    // routes return 401 (and pages redirect to /login) rather than 500.
    return null;
  }
}

/** Upserts the Prisma profile row for a Supabase user (idempotent). */
export async function ensureProfile(user: User) {
  const email = user.email ?? `${user.id}@studyforge.local`;
  const name =
    (user.user_metadata?.name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
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
