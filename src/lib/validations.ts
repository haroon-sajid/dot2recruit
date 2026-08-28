// Zod schemas for validating candidate submissions and n8n webhook payloads.
import { z } from "zod";
import type { CandidateInput } from "@/types";

export const candidateInputSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.email("Please enter a valid email address"),
  position: z.string().trim().min(1, "Position is required"),
  cvText: z.string().trim().min(50, "CV text must be at least 50 characters"),
  jdText: z.string().trim().min(50, "Job description must be at least 50 characters"),
}) satisfies z.ZodType<CandidateInput>;

export type CandidateInputSchema = z.infer<typeof candidateInputSchema>;

/**
 * Editable candidate details. The CV and job description are deliberately not
 * editable: they are the inputs the stored screening result was produced from,
 * so changing them would leave the score describing text that no longer exists.
 * Re-screen instead.
 */
export const candidateUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.email("Please enter a valid email address"),
  position: z.string().trim().min(1, "Position is required"),
});

export type CandidateUpdateSchema = z.infer<typeof candidateUpdateSchema>;

/** Body for POST /api/job-descriptions (a saved, reusable position). */
export const jobDescriptionInputSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters"),
  jd_text: z.string().trim().min(50, "Job description must be at least 50 characters"),
});

export type JobDescriptionInputSchema = z.infer<typeof jobDescriptionInputSchema>;

/**
 * The `result` object n8n posts back. Keys are snake_case so they map 1:1
 * onto `screening_results` columns.
 */
export const screeningResultSchema = z.object({
  overall_score: z
    .number()
    .int("overall_score must be an integer")
    .min(0, "overall_score must be between 0 and 100")
    .max(100, "overall_score must be between 0 and 100"),
  relevant_experience: z.string().nullish(),
  technical_skills_match: z.string().nullish(),
  education_match: z.string().nullish(),
  missing_skills: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
  concerns: z.array(z.string()).default([]),
  decision: z.enum(["strong_match", "potential_match", "not_a_match"]),
  decision_reason: z.string().trim().min(1, "decision_reason is required"),
  interview_recommended: z.boolean().nullish(),
});

export type ScreeningResultInput = z.infer<typeof screeningResultSchema>;

/** Full n8n callback body: { candidateId, result }. */
export const webhookResultSchema = z.object({
  candidateId: z.uuid("candidateId must be a UUID"),
  result: screeningResultSchema,
});

export type WebhookResultInput = z.infer<typeof webhookResultSchema>;