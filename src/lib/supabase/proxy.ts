import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAnonKey, supabaseUrl } from "@/lib/env";
import { GUEST_COOKIE, verifyGuestToken } from "@/lib/guest";

/**
 * Refreshes the Supabase auth session and gates protected routes.
 * Invoked from the root `proxy.ts` (Next.js 16's replacement for middleware).
 *
 * This is a first line of defence only: the session cookie is refreshed here so
 * Server Components always see a valid user, and unauthenticated requests are
 * bounced early. Pages and route handlers still authorize independently via
 * `requireUser()` / `getApiUser()` — never rely on the proxy alone. (Server
 * Actions in particular are POSTs to whatever route hosts them, so a matcher
 * change can silently drop proxy coverage.)
 */

/** Everything under these prefixes requires a signed-in user (or a guest). */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/subjects",
  "/topics",
  "/flashcards",
  "/tests",
  "/simulations",
  "/exams",
  "/question-bank",
  "/study-plan",
  "/analytics",
  "/chat",
  "/settings",
  "/goals",
];

/** Auth screens a fully signed-in user should never see. */
const AUTH_ROUTES = ["/login"];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = supabaseUrl();
  const anonKey = supabaseAnonKey();

  // A verified guest cookie counts as authenticated for routing purposes, and is
  // checked even when Supabase is unconfigured so guest mode stands on its own.
  const isGuest = Boolean(
    verifyGuestToken(request.cookies.get(GUEST_COOKIE)?.value)
  );

  // If Supabase isn't configured yet, don't crash every request — just pass
  // through, gating protected routes on the guest cookie alone.
  if (!url || !anonKey) {
    return gate(request, supabaseResponse, false, isGuest);
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  let signedIn = false;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = Boolean(user);
  } catch {
    // Supabase unreachable — fall back to the guest cookie rather than 500ing
    // every request in the app.
  }

  return gate(request, supabaseResponse, signedIn, isGuest);
}

function gate(
  request: NextRequest,
  response: NextResponse,
  signedIn: boolean,
  isGuest: boolean
) {
  const { pathname, search } = request.nextUrl;

  if (!signedIn && !isGuest && isProtected(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    // Come back to where they were headed once they've signed in.
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  // Guests are deliberately *not* bounced off /login — that page is how they
  // upgrade to a real account and keep the work they've done as a guest.
  if (signedIn && AUTH_ROUTES.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
