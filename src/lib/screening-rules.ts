// The scoring rules the prompt states, applied in code so a stored result can
// never carry a decision that disagrees with its own score.
import type { Decision } from "@/types";

export const STRONG_MATCH_MIN = 75;
export const POTENTIAL_MATCH_MIN = 50;
export const INTERVIEW_MIN = 60;

/** strong_match at 75+, potential_match at 50-74, not_a_match below 50. */
export function decisionForScore(score: number): Decision {
  if (score >= STRONG_MATCH_MIN) return "strong_match";
  if (score >= POTENTIAL_MATCH_MIN) return "potential_match";
  return "not_a_match";
}

/** Interview recommended at 60+. */
export function interviewRecommendedForScore(score: number): boolean {
  return score >= INTERVIEW_MIN;
}
