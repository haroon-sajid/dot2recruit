// API route: update and delete one of the signed-in user's saved job descriptions.
import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenantContext } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { jobDescriptionInputSchema } from "@/lib/validations";
import type { JobDescription } from "@/types";

export const dynamic = "force-dynamic";

/** PATCH /api/job-descriptions/[id] — update a saved position's title and text. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!z.uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid position id" }, { status: 400 });
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
      .update({ title: parsed.data.title, jd_text: parsed.data.jd_text })
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId)
      .select("id, title, jd_text, created_at")
      .maybeSingle();

    if (error) {
      console.error(`[api/job-descriptions/${id}] Update failed:`, error);
      return NextResponse.json({ error: "Failed to update position" }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 });
    }

    return NextResponse.json(data as JobDescription);
  } catch (err) {
    console.error("[api/job-descriptions/[id]] PATCH unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** DELETE /api/job-descriptions/[id] — 404 unless the row is in the user's tenant. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!z.uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid position id" }, { status: 400 });
    }

    // Scoping the delete to the tenant means another tenant's id simply
    // matches no rows, which is reported as a 404.
    const { data, error } = await supabaseAdmin
      .from("job_descriptions")
      .delete()
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error(`[api/job-descriptions/${id}] Delete failed:`, error);
      return NextResponse.json({ error: "Failed to delete position" }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/job-descriptions/[id]] DELETE unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
