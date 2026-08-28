// Shared TypeScript types (Candidate, ScreeningResult, CandidateStatus, etc.).
// These mirror supabase/schema.sql — keep both in sync.

export type CandidateStatus = "pending" | "processing" | "completed" | "failed";

export type Decision = "strong_match" | "potential_match" | "not_a_match";

export type ApprovalStatus = "pending_review" | "approved" | "rejected";

/** Row in the `tenants` table. */
export interface Tenant {
  id: string;
  name: string;
  created_at: string;
}

/** Row in the `profiles` table (one per auth user). */
export interface Profile {
  id: string;
  tenant_id: string;
  full_name: string | null;
  created_at: string;
}

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

/** Slim record of a prior screening for the same person and position. */
export interface DuplicateCandidate {
  id: string;
  name: string;
  position: string;
  status: CandidateStatus;
  created_at: string;
  overall_score: number | null;
  decision: Decision | null;
}

/** Row in the `job_descriptions` table: a saved, reusable position. */
export interface JobDescription {
  id: string;
  tenant_id: string;
  title: string;
  jd_text: string;
  created_at: string;
}

/** Payload for creating a saved position. */
export interface JobDescriptionInput {
  title: string;
  jd_text: string;
}

/** Best-effort fields detected in an uploaded CV. Any field may be null. */
export interface DetectedFields {
  name: string | null;
  email: string | null;
  position: string | null;
}

/** Body returned by POST /api/extract-text. */
export interface ExtractTextResponse {
  text: string;
  detected: DetectedFields;
}

/** Body returned by GET /api/me for the signed-in user. */
export interface MeResponse {
  email: string | null;
  fullName: string | null;
  companyName: string | null;
}

/** Payload submitted from the candidate form (camelCase, pre-insert). */
export interface CandidateInput {
  name: string;
  email: string;
  position: string;
  cvText: string;
  jdText: string;
}
