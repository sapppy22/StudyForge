import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/session";

/**
 * OAuth / email-confirmation / password-recovery callback.
 *
 * Supabase redirects here with a one-time `code`, which we exchange for a
 * session cookie before forwarding the user on to `next`.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const providerError =
    searchParams.get("error_description") ?? searchParams.get("error");

  // Only same-origin relative paths — an attacker-supplied `next` must not be
  // able to bounce a freshly authenticated user off-site.
  const requested = searchParams.get("next");
  const next =
    requested && requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/dashboard";

  // Behind a proxy (Vercel and friends) `origin` is the internal host; prefer
  // the forwarded host so the redirect lands on the public URL.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const baseUrl = forwardedHost ? `${forwardedProto}://${forwardedHost}` : origin;

  if (providerError) {
    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent(providerError)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      // Create/refresh the Prisma profile row (via Prisma so the NOT NULL
      // updatedAt column is populated correctly).
      await ensureProfile(data.user);
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  return NextResponse.redirect(`${baseUrl}/login?error=callback_failed`);
}
