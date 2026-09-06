// Zod schemas for validating candidate submissions and n8n webhook payloads.
import { z } from "zod";
import type { CandidateInput } from "@/types";

/** Upper bound for pasted or extracted CV and job description text. */
export const MAX_TEXT_LENGTH = 50_000;
export const MIN_TEXT_LENGTH = 50;
const MAX_NAME_LENGTH = 200;
const MAX_POSITION_LENGTH = 200;

const nameField = z
  .string("Name is required")
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(MAX_NAME_LENGTH, `Name must be ${MAX_NAME_LENGTH} characters or fewer`);
const emailField = z.email("Please enter a valid email address").max(320, "Email address is too long");
const positionField = z
  .string("Position is required")
  .trim()
  .min(1, "Position is required")
  .max(MAX_POSITION_LENGTH, `Position must be ${MAX_POSITION_LENGTH} characters or fewer`);
const cvField = z
  .string("CV text is required")
  .trim()
  .min(MIN_TEXT_LENGTH, `CV text must be at least ${MIN_TEXT_LENGTH} characters`)
  .max(MAX_TEXT_LENGTH, `CV text must be ${MAX_TEXT_LENGTH.toLocaleString("en-US")} characters or fewer`);
const jdField = z
  .string("Job description is required")
  .trim()
  .min(MIN_TEXT_LENGTH, `Job description must be at least ${MIN_TEXT_LENGTH} characters`)
  .max(MAX_TEXT_LENGTH, `Job description must be ${MAX_TEXT_LENGTH.toLocaleString("en-US")} characters or fewer`);

export const candidateInputSchema = z.object({
  name: nameField,
  email: emailField,
  position: positionField,
  cvText: cvField,
  jdText: jdField,
}) satisfies z.ZodType<CandidateInput>;

export type CandidateInputSchema = z.infer<typeof candidateInputSchema>;

/**
 * Editable candidate details. The CV and job description are deliberately not
 * editable: they are the inputs the stored screening result was produced from,
 * so changing them would leave the score describing text that no longer exists.
 * Re-screen instead.
 */
export const candidateUpdateSchema = z.object({
  name: nameField,
  email: emailField,
  position: positionField,
});

export type CandidateUpdateSchema = z.infer<typeof candidateUpdateSchema>;

/** Body for POST /api/job-descriptions (a saved, reusable position). */
export const jobDescriptionInputSchema = z.object({
  title: z
    .string("Title is required")
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(MAX_POSITION_LENGTH, `Title must be ${MAX_POSITION_LENGTH} characters or fewer`),
  jd_text: jdField,
});

export type JobDescriptionInputSchema = z.infer<typeof jobDescriptionInputSchema>;

// Bounds for the AI result. The prompt asks for a few sentences per field and
// short lists; anything far beyond that is a malformed response, not a result.
const MAX_RESULT_TEXT = 10_000;
const MAX_RESULT_ITEMS = 100;
const MAX_RESULT_ITEM_LENGTH = 1_000;

const resultText = z.string().max(MAX_RESULT_TEXT, `Text fields must be ${MAX_RESULT_TEXT} characters or fewer`);
const resultList = z
  .array(z.string().max(MAX_RESULT_ITEM_LENGTH, `List items must be ${MAX_RESULT_ITEM_LENGTH} characters or fewer`))
  .max(MAX_RESULT_ITEMS, `Lists must have ${MAX_RESULT_ITEMS} items or fewer`)
  .default([]);

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
  relevant_experience: resultText.nullish(),
  technical_skills_match: resultText.nullish(),
  education_match: resultText.nullish(),
  missing_skills: resultList,
  strengths: resultList,
  concerns: resultList,
  decision: z.enum(["strong_match", "potential_match", "not_a_match"]),
  decision_reason: resultText.trim().min(1, "decision_reason is required"),
  interview_recommended: z.boolean().nullish(),
});

export type ScreeningResultInput = z.infer<typeof screeningResultSchema>;

/** Full n8n callback body: { candidateId, result }. */
export const webhookResultSchema = z.object({
  candidateId: z.uuid("candidateId must be a UUID"),
  result: screeningResultSchema,
});

export type WebhookResultInput = z.infer<typeof webhookResultSchema>;
