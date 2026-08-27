// API route: receives the screening result callback from n8n and stores it in Supabase.
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { webhookResultSchema } from "@/lib/validations";
import type { CandidateStatus } from "@/types";

export const dynamic = "force-dynamic";

/** Constant-time comparison of the presented secret against the configured one. */
function secretMatches(presented: string | null, expected: string): boolean {
  if (!presented) return false;
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function setCandidateStatus(id: string, status: CandidateStatus) {
  const { error } = await supabaseAdmin
    .from("candidates")
    .update({ status })
    .eq("id", id);
  if (error) {
    console.error(`[api/webhook/result] Failed to set status=${status} for ${id}:`, error);
  }
}

/** POST /api/webhook/result — n8n posts the finished screening here. */
export async function POST(request: Request) {
  try {
    const expectedSecret = process.env.N8N_WEBHOOK_SECRET;
    if (!expectedSecret) {
      console.error("[api/webhook/result] N8N_WEBHOOK_SECRET is not set; rejecting callback");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }
    if (!secretMatches(request.headers.get("x-webhook-secret"), expectedSecret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }

    const parsed = webhookResultSchema.safeParse(body);
    if (!parsed.success) {
      // Mark the candidate failed if we can at least identify it.
      const candidateId =
        typeof body === "object" && body !== null && "candidateId" in body
          ? z.uuid().safeParse((body as { candidateId: unknown }).candidateId)
          : null;
      if (candidateId?.success) {
        console.error(
          `[api/webhook/result] Invalid result payload for ${candidateId.data}:`,
          z.flattenError(parsed.error),
        );
        await setCandidateStatus(candidateId.data, "failed");
      }
      return NextResponse.json(
        { error: "Validation failed", fieldErrors: z.flattenError(parsed.error).fieldErrors },
        { status: 400 },
      );
    }
    const { candidateId, result } = parsed.data;

    const { data: candidate, error: lookupError } = await supabaseAdmin
      .from("candidates")
      .select("id, tenant_id")
      .eq("id", candidateId)
      .maybeSingle();

    if (lookupError) {
      console.error(`[api/webhook/result] Candidate lookup failed for ${candidateId}:`, lookupError);
      return NextResponse.json({ error: "Failed to store result" }, { status: 500 });
    }
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const { error: insertError } = await supabaseAdmin.from("screening_results").insert({
      candidate_id: candidateId,
      tenant_id: candidate.tenant_id as string,
      overall_score: result.overall_score,
      relevant_experience: result.relevant_experience ?? null,
      technical_skills_match: result.technical_skills_match ?? null,
      education_match: result.education_match ?? null,
      missing_skills: result.missing_skills,
      strengths: result.strengths,
      concerns: result.concerns,
      decision: result.decision,
      decision_reason: result.decision_reason,
      interview_recommended: result.interview_recommended ?? null,
    });

    if (insertError) {
      console.error(`[api/webhook/result] Insert failed for ${candidateId}:`, insertError);
      await setCandidateStatus(candidateId, "failed");
      return NextResponse.json({ error: "Failed to store result" }, { status: 500 });
    }

    await setCandidateStatus(candidateId, "completed");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/webhook/result] POST unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}