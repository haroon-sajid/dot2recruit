// API route: read, update, and delete one of the signed-in user's tenant candidates.
import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenantContext } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { candidateUpdateSchema } from "@/lib/validations";
import type { Candidate, CandidateWithResult, ScreeningResult } from "@/types";

// Always hit the database; never prerender or cache this route.
export const dynamic = "force-dynamic";

type CandidateJoinRow = Candidate & { screening_results: ScreeningResult[] | null };

/** GET /api/candidates/[id] — one candidate with its latest screening result; 404 if not in the user's tenant. */
export async function GET(
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
      return NextResponse.json({ error: "Invalid candidate id" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("candidates")
      .select("*, screening_results(*)")
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId)
      .order("created_at", { referencedTable: "screening_results", ascending: false })
      .maybeSingle();

    if (error) {
      console.error(`[api/candidates/${id}] Query failed:`, error);
      return NextResponse.json({ error: "Failed to load candidate" }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const { screening_results, ...candidate } = data as CandidateJoinRow;
    const result: CandidateWithResult = {
      ...candidate,
      screening_result: screening_results?.[0] ?? null,
    };
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/candidates/[id]] GET unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** PATCH /api/candidates/[id] — update the candidate's name, email, and position. */
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
      return NextResponse.json({ error: "Invalid candidate id" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }

    const parsed = candidateUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", fieldErrors: z.flattenError(parsed.error).fieldErrors },
        { status: 400 },
      );
    }

    // Scoped to the tenant, so another tenant's id simply matches nothing.
    const { data, error } = await supabaseAdmin
      .from("candidates")
      .update({
        name: parsed.data.name,
        email: parsed.data.email,
        position: parsed.data.position,
      })
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error(`[api/candidates/${id}] Update failed:`, error);
      return NextResponse.json({ error: "Failed to update candidate" }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/candidates/[id]] PATCH unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/candidates/[id] — remove the candidate. Its screening results go
 * with it through the `on delete cascade` on screening_results.candidate_id.
 */
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
      return NextResponse.json({ error: "Invalid candidate id" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("candidates")
      .delete()
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error(`[api/candidates/${id}] Delete failed:`, error);
      return NextResponse.json({ error: "Failed to delete candidate" }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/candidates/[id]] DELETE unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
