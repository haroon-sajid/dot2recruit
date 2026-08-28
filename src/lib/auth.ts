// Resolves the signed-in user and their tenant for API routes.
import { supabaseAdmin } from "@/lib/supabase";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export interface TenantContext {
  userId: string;
  email: string | null;
  tenantId: string;
}

/** Returns null when there is no session or the user has no profile row. */
export async function getTenantContext(): Promise<TenantContext | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error(`[auth] Profile lookup failed for ${user.id}:`, error);
    return null;
  }
  if (!profile) {
    console.error(`[auth] No profile for user ${user.id}; is the auth.users trigger installed?`);
    return null;
  }

  return { userId: user.id, email: user.email ?? null, tenantId: profile.tenant_id as string };
}
