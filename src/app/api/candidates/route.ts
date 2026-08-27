// API route: create/list candidates and trigger the n8n screening workflow.
import { NextResponse } from "next/server";
import { z } from "zod";
import { DEFAULT_TENANT_ID, supabaseAdmin } from "@/lib/supabase";
import { triggerScreening } from "@/lib/n8n";
import { candidateInputSchema } from "@/lib/validations";
import type {
  Candidate,
  CandidateStatus,
  CandidateWithResult,
  ScreeningResult,
} from "@/types";

// Always hit the database; never prerender or cache this route.
export const dynamic = "force-dynamic";

type CandidateJoinRow = Candidate & { screening_results: ScreeningResult[] | null };

function toCandidateWithResult(row: CandidateJoinRow): CandidateWithResult {
  const { screening_results, ...candidate } = row;
  return { ...candidate, screening_result: screening_results?.[0] ?? null };
}

async function setCandidateStatus(id: string, status: CandidateStatus) {
  const { error } = await supabaseAdmin
    .from("candidates")
    .update({ status })
    .eq("id", id);
  if (error) {
    console.error(`[api/candidates] Failed to set status=${status} for ${id}:`, error);
  }
}

/** POST /api/candidates — create a candidate and kick off screening. */
export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }

    const parsed = candidateInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", fieldErrors: z.flattenError(parsed.error).fieldErrors },
        { status: 400 },
      );
    }
    const input = parsed.data;

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("candidates")
      .insert({
        tenant_id: DEFAULT_TENANT_ID,
        name: input.name,
        email: input.email,
        position: input.position,
        cv_text: input.cvText,
        jd_text: input.jdText,
        status: "pending" satisfies CandidateStatus,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("[api/candidates] Insert failed:", insertError);
      return NextResponse.json({ error: "Failed to create candidate" }, { status: 500 });
    }
    const id = inserted.id as string;

    try {
      await triggerScreening({
        candidateId: id,
        cvText: input.cvText,
        jdText: input.jdText,
        position: input.position,
        tenantId: DEFAULT_TENANT_ID,
      });
    } catch (err) {
      console.error(`[api/candidates] Screening trigger failed for ${id}:`, err);
      await setCandidateStatus(id, "failed");
      return NextResponse.json(
        { id, error: "Candidate was saved but the screening service could not be reached" },
        { status: 502 },
      );
    }

    await setCandidateStatus(id, "processing");
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("[api/candidates] POST unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** GET /api/candidates — all candidates (newest first) with their screening result. */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("candidates")
      .select("*, screening_results(*)")
      .eq("tenant_id", DEFAULT_TENANT_ID)
      .order("created_at", { ascending: false })
      .order("created_at", { referencedTable: "screening_results", ascending: false });

    if (error) {
      console.error("[api/candidates] List query failed:", error);
      return NextResponse.json({ error: "Failed to load candidates" }, { status: 500 });
    }

    const candidates = ((data ?? []) as CandidateJoinRow[]).map(toCandidateWithResult);
    return NextResponse.json({ candidates });
  } catch (err) {
    console.error("[api/candidates] GET unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}