// Client hook: loads one candidate and keeps polling while its screening runs.
"use client";

import { useEffect, useState } from "react";
import type { CandidateWithResult } from "@/types";

const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 3 * 60 * 1_000;

export function isScreeningInProgress(status: CandidateWithResult["status"]) {
  return status === "pending" || status === "processing";
}

export interface UseCandidateResult {
  candidate: CandidateWithResult | null;
  error: string | null;
  /** True once polling gave up while the screening was still running. */
  timedOut: boolean;
}

/**
 * Polling stops on completed, failed, or the timeout. Mount this only when there
 * is a candidate to watch; remount with a different id to follow another one.
 */
export function useCandidate(candidateId: string): UseCandidateResult {
  const [candidate, setCandidate] = useState<CandidateWithResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let hasData = false;
    const startedAt = Date.now();

    const scheduleNext = () => {
      if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
        setTimedOut(true);
        return;
      }
      timer = setTimeout(load, POLL_INTERVAL_MS);
    };

    async function load() {
      try {
        const res = await fetch(`/api/candidates/${candidateId}`, { cache: "no-store" });
        if (cancelled) return;

        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          setError(
            res.status === 404 ? "Candidate not found." : (data?.error ?? "Failed to load candidate."),
          );
          return;
        }

        const data = (await res.json()) as CandidateWithResult;
        if (cancelled) return;
        hasData = true;
        setCandidate(data);
        if (isScreeningInProgress(data.status)) scheduleNext();
      } catch {
        if (cancelled) return;
        // A blip mid-poll should retry rather than replace a result already on screen.
        if (hasData) scheduleNext();
        else setError("Could not reach the server. Check your connection and try again.");
      }
    }

    load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [candidateId]);

  return { candidate, error, timedOut };
}
