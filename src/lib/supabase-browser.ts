// Browser Supabase client (anon key) for auth calls from client components.
import { createBrowserClient } from "@supabase/ssr";

export function createBrowserSupabaseClient() {
  // Literal process.env.* access so Next can inline these into the client bundle.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "[supabase] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set",
    );
  }
  return createBrowserClient(url, key);
}
