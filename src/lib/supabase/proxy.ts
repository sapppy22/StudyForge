import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session and gates protected routes.
 * Invoked from the root `proxy.ts` (Next.js 16's replacement for middleware).
 *
 * This is a first line of defence only: the session cookie is refreshed here so
 * Server Components always see a valid user, and unauthenticated requests are
 * bounced early. Pages and route handlers still authorize independently via
 * `requireUser()` / `getApiUser()` — never rely on the proxy alone.
 */

/** Everything under these prefixes requires a signed-in user. */
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

/** Auth screens that a signed-in user should never see. */
const AUTH_ROUTES = ["/login"];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // If Supabase isn't configured yet, don't crash every request — just pass through.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
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
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (!user && isProtected(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    // Come back to where they were headed once they've signed in.
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  if (user && AUTH_ROUTES.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
