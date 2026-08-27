// Shared TypeScript types (Candidate, ScreeningResult, CandidateStatus, etc.).
// These mirror supabase/schema.sql — keep both in sync.

export type CandidateStatus = "pending" | "processing" | "completed" | "failed";

export type Decision = "strong_match" | "potential_match" | "not_a_match";

export type ApprovalStatus = "pending_review" | "approved" | "rejected";

/** Row in the `candidates` table. */
export interface Candidate {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  position: string;
  cv_text: string;
  jd_text: string;
  status: CandidateStatus;
  created_at: string;
}

/** Row in the `screening_results` table. */
export interface ScreeningResult {
  id: string;
  candidate_id: string;
  tenant_id: string;
  overall_score: number;
  relevant_experience: string | null;
  technical_skills_match: string | null;
  education_match: string | null;
  missing_skills: string[] | null;
  strengths: string[] | null;
  concerns: string[] | null;
  decision: Decision;
  decision_reason: string;
  interview_recommended: boolean | null;
  approval_status: ApprovalStatus;
  created_at: string;
}

/** Candidate with its (latest) screening result, as returned by the API. */
export interface CandidateWithResult extends Candidate {
  screening_result: ScreeningResult | null;
}

/** Payload submitted from the candidate form (camelCase, pre-insert). */
export interface CandidateInput {
  name: string;
  email: string;
  position: string;
  cvText: string;
  jdText: string;
}