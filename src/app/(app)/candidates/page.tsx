// Candidates dashboard: stats overview plus a card grid of all submitted candidates.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CandidateModal } from "@/components/candidate-modal";
import { DECISION_META, scoreTone } from "@/components/result-card";
import { StatusBadge } from "@/components/status-badge";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import type { CandidateWithResult, ScreeningResult } from "@/types";

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

function computeStats(candidates: CandidateWithResult[]) {
  const results = candidates
    .map((c) => c.screening_result)
    .filter((r): r is ScreeningResult => r !== null);
  const averageScore =
    results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.overall_score, 0) / results.length)
      : null;
  return {
    total: candidates.length,
    averageScore,
    strongMatches: results.filter((r) => r.decision === "strong_match").length,
    pendingReview: results.filter((r) => r.approval_status === "pending_review").length,
  };
}

function CandidateCard({
  candidate,
  onOpen,
}: {
  candidate: CandidateWithResult;
  onOpen: () => void;
}) {
  const result = candidate.screening_result;
  const decision = result ? DECISION_META[result.decision] : null;

  return (
    <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-5 shadow-[0_4px_20px_rgba(79,70,229,0.06)] transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-gray-900">{candidate.name}</h3>
          <p className="mt-0.5 truncate text-xs text-gray-500">{candidate.position}</p>
        </div>
        <StatusBadge status={candidate.status} />
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          {result ? (
            <p className={`text-3xl font-bold leading-none ${scoreTone(result.overall_score).text}`}>
              {result.overall_score}
              <span className="ml-1 text-sm font-medium text-gray-400">/ 100</span>
            </p>
          ) : (
            <p className="text-3xl font-bold leading-none text-gray-300">—</p>
          )}
        </div>
        {decision ? (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${decision.badge}`}
          >
            {decision.label}
          </span>
        ) : (
          <span className="text-xs text-gray-400">Not screened yet</span>
        )}
      </div>

      <p className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-400">
        Submitted {formatDate(candidate.created_at)}
      </p>

      <button
        type="button"
        onClick={onOpen}
        className="mt-3 w-full rounded-lg bg-white px-4 py-2 text-xs font-semibold text-[#4A90E2] shadow-sm ring-1 ring-inset ring-gray-200 transition hover:bg-[#EBF3FC] focus:outline-none focus:ring-2 focus:ring-[#4A90E2]/40"
      >
        View details
      </button>
    </div>
  );
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateWithResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

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

  const stats = computeStats(candidates ?? []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidates"
        subtitle="Every screened candidate, newest first."
        action={
          <Link
            href="/new-candidate"
            className="inline-flex items-center gap-2 rounded-lg bg-[#4A90E2] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3A7BD5]"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
            </svg>
            Screen Candidate
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Candidates" value={stats.total} hint="All submissions" />
        <MetricCard
          title="Average Score"
          value={stats.averageScore === null ? "—" : stats.averageScore}
          hint="Completed screenings"
        />
        <MetricCard title="Strong Matches" value={stats.strongMatches} hint="Decision: strong" />
        <MetricCard title="Pending Review" value={stats.pendingReview} hint="Awaiting decision" />
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 shadow-[0_4px_20px_rgba(79,70,229,0.06)]"
        >
          {error}
        </div>
      ) : candidates === null ? (
        <div className="rounded-xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-500 shadow-[0_4px_20px_rgba(79,70,229,0.06)]">
          Loading candidates…
        </div>
      ) : candidates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-[0_4px_20px_rgba(79,70,229,0.06)]">
          <p className="text-base font-semibold text-gray-900">No candidates yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Submit your first candidate to see their screening result here.
          </p>
          <div className="mt-4">
            <Link
              href="/new-candidate"
              className="inline-flex items-center rounded-lg bg-[#4A90E2] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3A7BD5]"
            >
              + New Candidate
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onOpen={() => setOpenId(candidate.id)}
            />
          ))}
        </div>
      )}

      {openId && <CandidateModal candidateId={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
