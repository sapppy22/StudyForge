"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/session";
import { APP_URL } from "@/lib/env";

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error: error.message };
  // Guarantee the Prisma profile row exists (covers users created before this flow).
  if (data.user) await ensureProfile(data.user);

  redirect("/dashboard");
}

export async function signUpWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) return { error: error.message };

  // Create the profile row via Prisma (the previous raw `supabase.from` insert
  // omitted the NOT NULL `updatedAt` column and would fail).
  if (data.user) await ensureProfile(data.user);

  // When email confirmation is required there is no session yet — tell the user.
  if (!data.session) {
    return {
      message:
        "Check your inbox to confirm your email, then sign in to continue.",
    };
  }

  redirect("/dashboard");
}

export async function signInWithOAuth(provider: "google" | "github") {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${APP_URL}/api/auth/callback` },
  });

  if (error) return { error: error.message };
  if (data.url) redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
