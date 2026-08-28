// Derives dashboard/report figures from the candidate list returned by GET /api/candidates.
import type {
  CandidateStatus,
  CandidateWithResult,
  Decision,
  ScreeningResult,
} from "@/types";

export const DECISIONS: Decision[] = ["strong_match", "potential_match", "not_a_match"];
export const STATUSES: CandidateStatus[] = ["pending", "processing", "completed", "failed"];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface CandidateStats {
  /** Every candidate in the tenant. */
  total: number;
  /** Candidates that have a screening result (the ones the averages are drawn from). */
  scored: number;
  /** Mean overall score across scored candidates, or null when nothing is scored yet. */
  averageScore: number | null;
  decisions: Record<Decision, number>;
  statuses: Record<CandidateStatus, number>;
  /** Candidates submitted in the last 7 days. */
  thisWeek: number;
}

function emptyCounts<K extends string>(keys: readonly K[]): Record<K, number> {
  return Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>;
}

export function computeStats(
  candidates: CandidateWithResult[],
  now: number = Date.now(),
): CandidateStats {
  const results = candidates
    .map((candidate) => candidate.screening_result)
    .filter((result): result is ScreeningResult => result !== null);

  const decisions = emptyCounts(DECISIONS);
  results.forEach((result) => {
    if (result.decision in decisions) decisions[result.decision] += 1;
  });

  const statuses = emptyCounts(STATUSES);
  candidates.forEach((candidate) => {
    if (candidate.status in statuses) statuses[candidate.status] += 1;
  });

  const thisWeek = candidates.filter((candidate) => {
    const created = new Date(candidate.created_at).getTime();
    return !Number.isNaN(created) && now - created <= WEEK_MS;
  }).length;

  return {
    total: candidates.length,
    scored: results.length,
    averageScore:
      results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + r.overall_score, 0) / results.length)
        : null,
    decisions,
    statuses,
    thisWeek,
  };
}

/** Share of `total` as a whole percentage; 0 when there is nothing to divide by. */
export function percentOf(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}
