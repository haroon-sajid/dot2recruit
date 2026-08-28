// Inline screening result shown under the form after a candidate is submitted.
"use client";

import Link from "next/link";
import { ResultCard } from "@/components/result-card";
import { StatusBadge } from "@/components/status-badge";
import { isScreeningInProgress, useCandidate } from "@/lib/use-candidate";

function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function ScreeningResultPanel({
  candidateId,
  onScreenAnother,
}: {
  candidateId: string;
  onScreenAnother: () => void;
}) {
  const { candidate, error, timedOut } = useCandidate(candidateId);

  return (
    <section
      aria-live="polite"
      className="rounded-xl border border-gray-100 bg-white p-6 shadow-[0_4px_20px_rgba(79,70,229,0.06)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-bold tracking-tight text-gray-900">
              {candidate?.name ?? "Screening result"}
            </h2>
            {candidate && <StatusBadge status={candidate.status} />}
          </div>
          {candidate && (
            <p className="mt-1 text-sm text-gray-500">
              {candidate.position} · {candidate.email}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/candidates/${candidateId}`}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 transition hover:bg-gray-50"
          >
            Open full page
          </Link>
          <button
            type="button"
            onClick={onScreenAnother}
            className="rounded-lg bg-[#4A90E2] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#3A7BD5]"
          >
            Screen another
          </button>
        </div>
      </div>

      <div className="mt-5">
        {error ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
            {error}
          </div>
        ) : !candidate ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
            <Spinner className="h-5 w-5" /> Loading result…
          </div>
        ) : candidate.status === "completed" ? (
          candidate.screening_result ? (
            <ResultCard result={candidate.screening_result} />
          ) : (
            <div className="rounded-xl border border-yellow-100 bg-white p-6 text-sm text-yellow-800">
              Screening is marked complete but no result was recorded.
            </div>
          )
        ) : candidate.status === "failed" ? (
          <div className="rounded-xl border border-red-100 bg-white p-6">
            <p className="text-base font-semibold text-red-800">Screening failed</p>
            <p className="mt-1 text-sm text-gray-600">
              The screening workflow could not complete for this candidate. You can submit it again.
            </p>
          </div>
        ) : isScreeningInProgress(candidate.status) && timedOut ? (
          <div className="rounded-xl border border-yellow-100 bg-white p-6">
            <p className="text-base font-semibold text-gray-900">
              This is taking longer than expected
            </p>
            <p className="mt-1 text-sm text-gray-500">
              We stopped checking after 3 minutes. The screening may still finish. Open the full
              page in a moment to check again.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-blue-100 bg-white p-8 text-center">
            <Spinner className="mx-auto h-8 w-8 text-[#4A90E2]" />
            <p className="mt-4 text-base font-semibold text-gray-900">Screening in progress</p>
            <p className="mt-1 text-sm text-gray-500">
              Our AI is reviewing the CV against the job description. This updates automatically.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
