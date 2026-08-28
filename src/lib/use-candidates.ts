// Client hook: loads the tenant's candidates from GET /api/candidates once on mount.
"use client";

import { useEffect, useState } from "react";
import type { CandidateWithResult } from "@/types";

export interface UseCandidatesResult {
  /** null while the first request is still in flight. */
  candidates: CandidateWithResult[] | null;
  error: string | null;
  loading: boolean;
}

export function useCandidates(): UseCandidatesResult {
  const [candidates, setCandidates] = useState<CandidateWithResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/candidates", { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as
          | { candidates?: CandidateWithResult[]; error?: string }
          | null;
        if (cancelled) return;
        if (!res.ok || !data?.candidates) {
          setError(data?.error ?? "Failed to load candidates.");
          return;
        }
        setCandidates(data.candidates);
      } catch {
        if (!cancelled) {
          setError("Could not reach the server. Check your connection and try again.");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { candidates, error, loading: candidates === null && error === null };
}
