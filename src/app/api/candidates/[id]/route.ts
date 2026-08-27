// API route: fetch a single candidate with its screening result (polled by the result page).
import { NextResponse } from "next/server";
import { z } from "zod";
import { DEFAULT_TENANT_ID, supabaseAdmin } from "@/lib/supabase";
import type { Candidate, CandidateWithResult, ScreeningResult } from "@/types";

// Always hit the database; never prerender or cache this route.
export const dynamic = "force-dynamic";

type CandidateJoinRow = Candidate & { screening_results: ScreeningResult[] | null };

/** GET /api/candidates/[id] — one candidate with its latest screening result. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid candidate id" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("candidates")
      .select("*, screening_results(*)")
      .eq("id", id)
      .eq("tenant_id", DEFAULT_TENANT_ID)
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