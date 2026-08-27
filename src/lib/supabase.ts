// Supabase client factory (server-side, service-role key) used by API routes.
//
// NEVER import this from a client component: it holds the service-role key,
// which bypasses RLS. SUPABASE_SERVICE_ROLE_KEY has no NEXT_PUBLIC_ prefix, so
// it is only ever defined in the server bundle.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Single-tenant placeholder tenant id (matches the DB column defaults). */
export const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[supabase] Missing required environment variable ${name}. ` +
        "Copy .env.example to .env.local and fill it in.",
    );
  }
  return value;
}

let client: SupabaseClient | null = null;

/**
 * Create the client on first use. `next build` imports every route module to
 * collect its config, so validating env vars at import time would break builds
 * on machines without secrets; deferring to first access still fails fast with
 * a clear message on the first request that touches the database.
 */
function getClient(): SupabaseClient {
  if (!client) {
    client = createClient(
      requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          // Service-role usage: no user session to persist or refresh.
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
  }
  return client;
}

/** Server-only Supabase client (service role). Usable like a normal client. */
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const real = getClient();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});