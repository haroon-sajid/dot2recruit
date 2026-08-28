// API route: profile summary for the signed-in user, used by the settings page.
import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import type { MeResponse } from "@/types";

// Always hit the database; never prerender or cache this route.
export const dynamic = "force-dynamic";

/** GET /api/me — the signed-in user's email, full name, and tenant (company) name. */
export async function GET() {
  try {
    const ctx = await getTenantContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [profile, tenant] = await Promise.all([
      supabaseAdmin.from("profiles").select("full_name").eq("id", ctx.userId).maybeSingle(),
      supabaseAdmin.from("tenants").select("name").eq("id", ctx.tenantId).maybeSingle(),
    ]);

    if (profile.error || tenant.error) {
      console.error(
        `[api/me] Lookup failed for ${ctx.userId}:`,
        profile.error ?? tenant.error,
      );
      return NextResponse.json({ error: "Failed to load your profile" }, { status: 500 });
    }

    const body: MeResponse = {
      email: ctx.email,
      fullName: (profile.data?.full_name as string | null) ?? null,
      companyName: (tenant.data?.name as string | null) ?? null,
    };
    return NextResponse.json(body);
  } catch (err) {
    console.error("[api/me] GET unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
