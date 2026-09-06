// API route: create/list the signed-in user's tenant candidates and trigger the n8n screening workflow.
import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenantContext } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { triggerScreening } from "@/lib/n8n";
import { checkRateLimit, RATE_LIMITS, rateLimitedResponse } from "@/lib/rate-limit";
import { failStaleScreenings } from "@/lib/stale";
import { candidateInputSchema } from "@/lib/validations";
import type {
  Candidate,
  CandidateListItem,
  CandidateStatus,
  ScreeningResult,
} from "@/types";

// Always hit the database; never prerender or cache this route.
export const dynamic = "force-dynamic";

// Two submissions of the same person for the same position inside this window
// are treated as one accidental double submit rather than a deliberate re-screen.
const DOUBLE_SUBMIT_WINDOW_MS = 15_000;

type CandidateListRow = Omit<Candidate, "cv_text" | "jd_text"> & {
  screening_results: ScreeningResult[] | null;
};

function toListItem(row: CandidateListRow): CandidateListItem {
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

/** POST /api/candidates — create a candidate in the user's tenant and kick off screening. */
export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = checkRateLimit(ctx.userId, RATE_LIMITS.screen);
    if (!limit.ok) return rateLimitedResponse(limit.retryAfterSec);

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

    // Guard against an accidental double submit: same person, same position,
    // a screening already running from moments ago.
    const since = new Date(Date.now() - DOUBLE_SUBMIT_WINDOW_MS).toISOString();
    const { data: recent } = await supabaseAdmin
      .from("candidates")
      .select("id")
      .eq("tenant_id", ctx.tenantId)
      .ilike("email", escapeLike(input.email))
      .ilike("position", escapeLike(input.position))
      .in("status", ["pending", "processing"])
      .gte("created_at", since)
      .limit(1)
      .maybeSingle();
    if (recent) {
      return NextResponse.json(
        { id: recent.id as string, error: "This candidate was submitted a moment ago and is already being screened." },
        { status: 409 },
      );
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("candidates")
      .insert({
        tenant_id: ctx.tenantId,
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
        tenantId: ctx.tenantId,
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

/** Escapes LIKE wildcards so a literal %, _ or \ in user input matches itself. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * GET /api/candidates — the user's tenant candidates (newest first) with their
 * screening result. Returns summary columns only; the CV and job description
 * come from GET /api/candidates/[id].
 */
export async function GET() {
  try {
    const ctx = await getTenantContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await failStaleScreenings(ctx.tenantId);

    const { data, error } = await supabaseAdmin
      .from("candidates")
      .select("id, tenant_id, name, email, position, status, created_at, screening_results(*)")
      .eq("tenant_id", ctx.tenantId)
      .order("created_at", { ascending: false })
      .order("created_at", { referencedTable: "screening_results", ascending: false });

    if (error) {
      console.error("[api/candidates] List query failed:", error);
      return NextResponse.json({ error: "Failed to load candidates" }, { status: 500 });
    }

    const candidates = ((data ?? []) as CandidateListRow[]).map(toListItem);
    return NextResponse.json({ candidates });
  } catch (err) {
    console.error("[api/candidates] GET unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
