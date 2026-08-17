import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "@/lib/env";

/** Browser-side Supabase client (auth state lives in cookies, shared with SSR). */
export function createClient() {
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}
