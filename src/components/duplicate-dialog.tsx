// Confirmation shown when the same person has already been screened for the same
// position. Re-screening costs AI credits, so it needs an explicit confirmation.
"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { DECISION_META, scoreTone } from "@/components/result-card";
import { StatusBadge } from "@/components/status-badge";
import type { DuplicateCandidate } from "@/types";

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

export function DuplicateDialog({
  name,
  position,
  existing,
  onConfirm,
  onCancel,
}: {
  name: string;
  position: string;
  existing: DuplicateCandidate[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCancel();
      }
    }
    document.addEventListener("keydown", onKeyDown, true);
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [onCancel]);

  const completed = existing.filter((c) => c.status === "completed");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-900/40 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="duplicate-title"
        aria-describedby="duplicate-description"
        tabIndex={-1}
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)] outline-none"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF4E0] text-[#CC8400]">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="min-w-0">
            <h2 id="duplicate-title" className="text-base font-bold text-gray-900">
              Already screened
            </h2>
            <p id="duplicate-description" className="mt-1 text-sm text-gray-600">
              {name} has already been screened for {position}
              {completed.length > 0 ? " and a result is available" : ""}. Screening again will
              call the AI and use credits.
            </p>
          </div>
        </div>

        <ul className="mt-4 divide-y divide-gray-50 overflow-hidden rounded-lg bg-gray-50">
          {existing.slice(0, 3).map((candidate) => {
            const decision = candidate.decision ? DECISION_META[candidate.decision] : null;
            return (
              <li key={candidate.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">{formatDate(candidate.created_at)}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <StatusBadge status={candidate.status} />
                    {decision && (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${decision.badge}`}
                      >
                        {decision.label}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {candidate.overall_score !== null && (
                    <span
                      className={`text-lg font-bold tabular-nums ${scoreTone(candidate.overall_score).text}`}
                    >
                      {candidate.overall_score}
                    </span>
                  )}
                  <Link
                    href={`/candidates/${candidate.id}`}
                    className="text-xs font-semibold text-[#4A90E2] transition hover:text-[#3A7BD5]"
                  >
                    View
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
        {existing.length > 3 && (
          <p className="mt-2 text-xs text-gray-400">
            and {existing.length - 3} earlier {existing.length - 3 === 1 ? "screening" : "screenings"}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 transition hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-[#FFA500] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#E69500]"
          >
            Screen again anyway
          </button>
        </div>
      </div>
    </div>
  );
}
