// Modal showing one candidate's full screening result, opened from the candidates grid.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ResultCard } from "@/components/result-card";
import { StatusBadge } from "@/components/status-badge";
import type { CandidateWithResult } from "@/types";

const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 3 * 60 * 1_000;

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, summary, [tabindex]:not([tabindex="-1"])';

function isInProgress(status: CandidateWithResult["status"]) {
  return status === "pending" || status === "processing";
}

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

/** Collapsible block for the stored CV and job description text. */
function TextSection({ title, body }: { title: string; body: string }) {
  return (
    <details className="group rounded-xl border border-gray-100 bg-white">
      <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-3.5 text-sm font-semibold text-gray-900 marker:content-['']">
        <span>{title}</span>
        <span className="flex items-center gap-2 text-xs font-normal text-gray-400">
          {body.length} chars
          <svg
            className="h-4 w-4 transition-transform group-open:rotate-180"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </summary>
      <div className="border-t border-gray-100 px-5 py-4">
        <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words font-sans text-sm leading-6 text-gray-600">
          {body}
        </pre>
      </div>
    </details>
  );
}

export function CandidateModal({
  candidateId,
  onClose,
}: {
  candidateId: string;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [candidate, setCandidate] = useState<CandidateWithResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  // Load, then keep polling while the screening is still running.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
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
          setError(res.status === 404 ? "Candidate not found." : (data?.error ?? "Failed to load candidate."));
          return;
        }
        const data = (await res.json()) as CandidateWithResult;
        if (cancelled) return;
        setCandidate(data);
        if (isInProgress(data.status)) scheduleNext();
      } catch {
        if (!cancelled) setError("Could not reach the server. Please try again.");
      }
    }

    load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [candidateId]);

  // Escape to close, Tab cycles inside the panel.
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const items = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  // Trap focus, lock background scroll, and restore focus on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown, true);
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gray-900/40 p-4 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        // Only close when the press starts on the backdrop itself.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="candidate-modal-title"
        tabIndex={-1}
        className="my-4 w-full max-w-4xl rounded-xl bg-[#F5F7FF] shadow-[0_20px_60px_rgba(15,23,42,0.25)] outline-none"
      >
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-t-xl border-b border-gray-100 bg-white px-6 py-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2
                id="candidate-modal-title"
                className="truncate text-xl font-bold tracking-tight text-gray-900"
              >
                {candidate?.name ?? "Candidate"}
              </h2>
              {candidate && <StatusBadge status={candidate.status} />}
            </div>
            {candidate && (
              <p className="mt-1 text-sm text-gray-500">
                {candidate.position} · {candidate.email}
              </p>
            )}
            {candidate && (
              <p className="mt-0.5 text-xs text-gray-400">
                Submitted {formatDate(candidate.created_at)}
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
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-5 p-6">
          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-white p-6 text-center text-sm text-red-800"
            >
              {error}
            </div>
          ) : !candidate ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
              <Spinner className="h-5 w-5" /> Loading candidate…
            </div>
          ) : (
            <>
              {candidate.status === "completed" &&
                (candidate.screening_result ? (
                  <ResultCard result={candidate.screening_result} />
                ) : (
                  <div className="rounded-xl border border-yellow-100 bg-white p-6 text-sm text-yellow-800">
                    Screening is marked complete but no result was recorded.
                  </div>
                ))}

              {candidate.status === "failed" && (
                <div className="rounded-xl border border-red-100 bg-white p-6">
                  <p className="text-base font-semibold text-red-800">Screening failed</p>
                  <p className="mt-1 text-sm text-gray-600">
                    The screening workflow could not complete for this candidate.
                  </p>
                </div>
              )}

              {isInProgress(candidate.status) && (
                <div className="rounded-xl border border-blue-100 bg-white p-8 text-center">
                  {timedOut ? (
                    <>
                      <p className="text-base font-semibold text-gray-900">
                        This is taking longer than expected
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        We stopped checking after 3 minutes. The screening may still finish.
                        Reopen this candidate in a moment to check again.
                      </p>
                    </>
                  ) : (
                    <>
                      <Spinner className="mx-auto h-8 w-8 text-[#4A90E2]" />
                      <p className="mt-4 text-base font-semibold text-gray-900">
                        Screening in progress
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Our AI is reviewing the CV against the job description. This view updates
                        automatically.
                      </p>
                    </>
                  )}
                </div>
              )}

              <TextSection title="CV text" body={candidate.cv_text} />
              <TextSection title="Job description" body={candidate.jd_text} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
