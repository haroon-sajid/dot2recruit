// Candidates dashboard: stats overview plus a table of all submitted candidates.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DECISION_META, scoreTone } from "@/components/result-card";
import { StatusBadge } from "@/components/status-badge";
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

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{hint}</p>
    </div>
  );
}

function NewCandidateButton() {
  return (
    <Link
      href="/"
      className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
    >
      + New Candidate
    </Link>
  );
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Candidates</h1>
          <p className="mt-1 text-sm text-gray-600">Every screened candidate, newest first.</p>
        </div>
        <NewCandidateButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Candidates" value={stats.total} hint="All submissions" />
        <StatCard
          label="Average Score"
          value={stats.averageScore === null ? "—" : stats.averageScore}
          hint="Across completed screenings"
        />
        <StatCard label="Strong Matches" value={stats.strongMatches} hint="Decision: strong match" />
        <StatCard
          label="Pending Review"
          value={stats.pendingReview}
          hint="Results awaiting recruiter decision"
        />
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800"
        >
          {error}
        </div>
      ) : candidates === null ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500 shadow-sm">
          Loading candidates…
        </div>
      ) : candidates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
          <p className="text-base font-semibold text-gray-900">No candidates yet</p>
          <p className="mt-1 text-sm text-gray-600">
            Submit your first candidate to see their screening result here.
          </p>
          <div className="mt-4">
            <NewCandidateButton />
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th scope="col" className="px-4 py-3">Name</th>
                  <th scope="col" className="px-4 py-3">Position</th>
                  <th scope="col" className="px-4 py-3">Submitted</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3 text-right">Score</th>
                  <th scope="col" className="px-4 py-3">Decision</th>
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {candidates.map((candidate) => {
                  const result = candidate.screening_result;
                  const decision = result ? DECISION_META[result.decision] : null;
                  return (
                    <tr key={candidate.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{candidate.name}</div>
                        <div className="text-xs text-gray-500">{candidate.email}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{candidate.position}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {formatDate(candidate.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={candidate.status} />
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {result ? (
                          <span className={scoreTone(result.overall_score).text}>
                            {result.overall_score}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
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
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/candidates/${candidate.id}`}
                          className="font-medium text-indigo-600 hover:text-indigo-500"
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
