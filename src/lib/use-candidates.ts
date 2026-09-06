// Client hook: loads the tenant's candidates from GET /api/candidates.
"use client";

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { handleSessionExpired } from "@/lib/session";
import type { CandidateListItem } from "@/types";

// Without this a hung request would leave the page on "Loading…" forever.
const REQUEST_TIMEOUT_MS = 20_000;

export interface UseCandidatesResult {
  /** null while the first request is still in flight. */
  candidates: CandidateListItem[] | null;
  /** Lets a page apply an optimistic delete or edit without refetching. */
  setCandidates: Dispatch<SetStateAction<CandidateListItem[] | null>>;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

export function useCandidates(): UseCandidatesResult {
  const [candidates, setCandidates] = useState<CandidateListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const reload = useCallback(() => {
    setCandidates(null);
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    async function load() {
      try {
        const res = await fetch("/api/candidates", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (cancelled) return;
        if (handleSessionExpired(res)) return;
        const data = (await res.json().catch(() => null)) as
          | { candidates?: CandidateListItem[]; error?: string }
          | null;
        if (cancelled) return;
        if (!res.ok || !data?.candidates) {
          setError(data?.error ?? "Failed to load candidates.");
          return;
        }
        setCandidates(data.candidates);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error && err.name === "AbortError"
            ? "The server took too long to respond."
            : "Could not reach the server. Check your connection and try again.",
        );
      } finally {
        clearTimeout(timer);
      }
    }

    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [attempt]);

  // Restoring a page from the back/forward cache does not re-run effects, so a
  // load interrupted by navigating away would otherwise stay stuck on "Loading".
  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) reload();
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [reload]);

  return {
    candidates,
    setCandidates,
    error,
    loading: candidates === null && error === null,
    reload,
  };
}
