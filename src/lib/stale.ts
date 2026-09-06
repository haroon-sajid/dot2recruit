// Marks screenings that never reported back as failed, so nothing sits in
// "processing" forever. Runs lazily from the read endpoints and from the cron route.
import { supabaseAdmin } from "@/lib/supabase";

// n8n gives OpenAI 60s with retries and posts back with retries; anything past this is dead.
export const STALE_AFTER_MS = 10 * 60 * 1000;

/** Fails pending/processing candidates older than the cutoff. Returns how many changed. */
export async function failStaleScreenings(tenantId?: string): Promise<number> {
  const cutoff = new Date(Date.now() - STALE_AFTER_MS).toISOString();
  let query = supabaseAdmin
    .from("candidates")
    .update({ status: "failed" })
    .in("status", ["pending", "processing"])
    .lt("created_at", cutoff);
  if (tenantId) query = query.eq("tenant_id", tenantId);

  const { data, error } = await query.select("id");
  if (error) {
    // A failed sweep must not break the request that triggered it.
    console.error("[stale] Failed to mark stale screenings:", error);
    return 0;
  }
  const count = data?.length ?? 0;
  if (count > 0) console.warn(`[stale] Marked ${count} stale screening(s) as failed`);
  return count;
}
