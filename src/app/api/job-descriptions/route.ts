// API route: list and create the signed-in user's saved job descriptions (Positions).
import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenantContext } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { jobDescriptionInputSchema } from "@/lib/validations";
import type { JobDescription } from "@/types";

// Always hit the database; never prerender or cache this route.
export const dynamic = "force-dynamic";

/** GET /api/job-descriptions — the tenant's saved positions, newest first. */
export async function GET() {
  try {
    const ctx = await getTenantContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("job_descriptions")
      .select("id, title, jd_text, created_at")
      .eq("tenant_id", ctx.tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[api/job-descriptions] List query failed:", error);
      return NextResponse.json({ error: "Failed to load positions" }, { status: 500 });
    }

    return NextResponse.json({ jobDescriptions: (data ?? []) as JobDescription[] });
  } catch (err) {
    console.error("[api/job-descriptions] GET unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** POST /api/job-descriptions — save a new position for the tenant. */
export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }

    const parsed = jobDescriptionInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", fieldErrors: z.flattenError(parsed.error).fieldErrors },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("job_descriptions")
      .insert({
        tenant_id: ctx.tenantId,
        title: parsed.data.title,
        jd_text: parsed.data.jd_text,
      })
      .select("id, title, jd_text, created_at")
      .single();

    if (error || !data) {
      console.error("[api/job-descriptions] Insert failed:", error);
      return NextResponse.json({ error: "Failed to save position" }, { status: 500 });
    }

    return NextResponse.json(data as JobDescription, { status: 201 });
  } catch (err) {
    console.error("[api/job-descriptions] POST unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
