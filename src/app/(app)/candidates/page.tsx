// Candidates dashboard: stats overview plus a table of all submitted candidates.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

export default function CandidatesPage() {
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
            New Candidate
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
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_4px_20px_rgba(79,70,229,0.06)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50/60 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Name</th>
                  <th scope="col" className="px-5 py-3.5">Position</th>
                  <th scope="col" className="px-5 py-3.5">Submitted</th>
                  <th scope="col" className="px-5 py-3.5">Status</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Score</th>
                  <th scope="col" className="px-5 py-3.5">Decision</th>
                  <th scope="col" className="px-5 py-3.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {candidates.map((candidate) => {
                  const result = candidate.screening_result;
                  const decision = result ? DECISION_META[result.decision] : null;
                  return (
                    <tr key={candidate.id} className="transition hover:bg-[#F5F7FF]">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-gray-900">{candidate.name}</div>
                        <div className="text-xs text-gray-500">{candidate.email}</div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">{candidate.position}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-gray-500">
                        {formatDate(candidate.created_at)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={candidate.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold tabular-nums">
                        {result ? (
                          <span className={scoreTone(result.overall_score).text}>
                            {result.overall_score}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {decision ? (
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${decision.badge}`}
                          >
                            {decision.label}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/candidates/${candidate.id}`}
                          className="font-semibold text-[#4A90E2] transition hover:text-[#3A7BD5]"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
