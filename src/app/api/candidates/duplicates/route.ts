// API route: has this person already been screened for this position?
// Used by the form to warn before spending AI credits on a repeat screening.
import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import type { Candidate, DuplicateCandidate, ScreeningResult } from "@/types";

export const dynamic = "force-dynamic";

type Row = Pick<Candidate, "id" | "name" | "position" | "status" | "created_at"> & {
  screening_results: Pick<ScreeningResult, "overall_score" | "decision" | "created_at">[] | null;
};

/** GET /api/candidates/duplicates?email=&position= — prior screenings, newest first. */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim();
    const position = searchParams.get("position")?.trim();
    if (!email || !position) {
      return NextResponse.json(
        { error: "email and position query parameters are required" },
        { status: 400 },
      );
    }

    // ilike without wildcards is an exact match that ignores case. The values are
    // passed as parameters, so % or _ typed by a user cannot widen the match.
    const { data, error } = await supabaseAdmin
      .from("candidates")
      .select("id, name, position, status, created_at, screening_results(overall_score, decision, created_at)")
      .eq("tenant_id", ctx.tenantId)
      .ilike("email", email)
      .ilike("position", position)
      .order("created_at", { ascending: false })
      .order("created_at", { referencedTable: "screening_results", ascending: false });

    if (error) {
      console.error("[api/candidates/duplicates] Query failed:", error);
      return NextResponse.json({ error: "Failed to check for duplicates" }, { status: 500 });
    }

    const candidates: DuplicateCandidate[] = ((data ?? []) as Row[]).map((row) => {
      const latest = row.screening_results?.[0] ?? null;
      return {
        id: row.id,
        name: row.name,
        position: row.position,
        status: row.status,
        created_at: row.created_at,
        overall_score: latest?.overall_score ?? null,
        decision: latest?.decision ?? null,
      };
    });

    return NextResponse.json({ candidates });
  } catch (err) {
    console.error("[api/candidates/duplicates] GET unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
