// Candidate detail page: polls the API while screening runs, then shows the AI result.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ResultCard } from "@/components/result-card";
import { StatusBadge } from "@/components/status-badge";
import type { CandidateWithResult } from "@/types";

const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 3 * 60 * 1_000;

function isInProgress(status: CandidateWithResult["status"]) {
  return status === "pending" || status === "processing";
}

function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function BackLink() {
  return (
    <Link
      href="/candidates"
      className="inline-flex items-center rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
    >
      ← Back to dashboard
    </Link>
  );
}

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [candidate, setCandidate] = useState<CandidateWithResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [attempt, setAttempt] = useState(0);

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
        const res = await fetch(`/api/candidates/${id}`, { cache: "no-store" });
        if (cancelled) return;

        if (res.status === 404) {
          setError("Candidate not found.");
          return;
        }
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          setError(data?.error ?? "Failed to load candidate.");
          return;
        }

        const data = (await res.json()) as CandidateWithResult;
        if (cancelled) return;
        hasData = true;
        setCandidate(data);
        if (isInProgress(data.status)) scheduleNext();
      } catch {
        if (cancelled) return;
        // Transient network hiccup mid-poll: keep polling. Otherwise surface it.
        if (hasData) scheduleNext();
        else setError("Could not reach the server. Check your connection and try again.");
      }
    }

    load();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [id, attempt]);

  function retry() {
    setError(null);
    setTimedOut(false);
    setAttempt((n) => n + 1);
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-base font-semibold text-red-800">{error}</p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              type="button"
              onClick={retry}
              className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-red-500"
            >
              Try again
            </button>
            <BackLink />
          </div>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Spinner className="mr-2 h-5 w-5" /> Loading candidate…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="truncate text-2xl font-bold tracking-tight text-gray-900">
              {candidate.name}
            </h1>
            <StatusBadge status={candidate.status} />
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {candidate.position} · {candidate.email}
          </p>
        </div>
        <BackLink />
      </div>

      {candidate.status === "completed" &&
        (candidate.screening_result ? (
          <ResultCard result={candidate.screening_result} />
        ) : (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6 text-sm text-yellow-800">
            Screening is marked complete but no result was recorded.
          </div>
        ))}

      {candidate.status === "failed" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-base font-semibold text-red-800">Screening failed</p>
          <p className="mt-1 text-sm text-red-700">
            The screening workflow could not complete for this candidate. You can submit the
            candidate again from the home page.
          </p>
          <div className="mt-4">
            <BackLink />
          </div>
        </div>
      )}

      {isInProgress(candidate.status) && !timedOut && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-8 text-center">
          <Spinner className="mx-auto h-8 w-8 text-blue-600" />
          <p className="mt-4 text-base font-semibold text-blue-900">Screening in progress</p>
          <p className="mt-1 text-sm text-blue-800">
            Our AI is reviewing the CV against the job description. This usually takes under a
            minute — the page updates automatically.
          </p>
        </div>
      )}

      {isInProgress(candidate.status) && timedOut && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6">
          <p className="text-base font-semibold text-yellow-900">
            This is taking longer than expected
          </p>
          <p className="mt-1 text-sm text-yellow-800">
            We stopped checking after 3 minutes. The screening may still finish — check again in
            a moment, or come back later from the dashboard.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={retry}
              className="inline-flex items-center rounded-md bg-yellow-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-yellow-500"
            >
              Check again
            </button>
            <BackLink />
          </div>
        </div>
      )}
    </div>
  );
}
