// Dashboard page: overview of the tenant's real screening activity.
// Layout mirrors the app's card language: metric row, 2/3 split, segmented status bar.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DECISION_META, scoreTone } from "@/components/result-card";
import { StatusBadge } from "@/components/status-badge";
import { MetricCard } from "@/components/ui/metric-card";
import { computeStats, percentOf, STATUSES } from "@/lib/candidate-stats";
import { useCandidates } from "@/lib/use-candidates";
import type { CandidateStatus, CandidateWithResult, MeResponse } from "@/types";

const RECENT_LIMIT = 5;
const TOP_LIMIT = 3;

const STATUS_LABELS: Record<CandidateStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

const STATUS_COLOR: Record<CandidateStatus, string> = {
  pending: "bg-gray-300",
  processing: "bg-[#4A90E2]",
  completed: "bg-[#50C878]",
  failed: "bg-[#EF4444]",
};

// Rank badge colours, highest score first.
const RANK_COLOR = ["bg-[#50C878]", "bg-[#FFA500]", "bg-yellow-400"] as const;

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-gray-100 bg-white p-5 shadow-[0_4px_20px_rgba(79,70,229,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}

function NewCandidateButton() {
  return (
    <Link
      href="/new-candidate"
      className="inline-flex items-center gap-2 rounded-lg bg-[#4A90E2] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3A7BD5]"
    >
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
      </svg>
      New Candidate
    </Link>
  );
}

/** Greets by first name when the profile has one; otherwise stays generic. */
function useFirstName(): string | null {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<MeResponse>) : null))
      .then((data) => {
        if (cancelled || !data) return;
        setName(data.fullName?.trim().split(/\s+/)[0] ?? null);
      })
      .catch(() => {
        // A failed greeting lookup should not take the dashboard down.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return name;
}

/** Highest-scoring screened candidates, best first. */
function topScored(candidates: CandidateWithResult[]) {
  return candidates
    .filter((c) => c.screening_result !== null)
    .sort((a, b) => b.screening_result!.overall_score - a.screening_result!.overall_score)
    .slice(0, TOP_LIMIT);
}

export default function DashboardPage() {
  const { candidates, error, loading } = useCandidates();
  const firstName = useFirstName();

  const list = candidates ?? [];
  const stats = computeStats(list);
  const recent = list.slice(0, RECENT_LIMIT);
  const top = topScored(list);

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {firstName ? `Welcome back, ${firstName}` : "Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">An overview of your AI screening activity.</p>
        </div>
        <NewCandidateButton />
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 shadow-[0_4px_20px_rgba(79,70,229,0.06)]"
        >
          {error}
        </div>
      ) : loading ? (
        <div className="rounded-xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-500 shadow-[0_4px_20px_rgba(79,70,229,0.06)]">
          Loading dashboard…
        </div>
      ) : stats.total === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-[0_4px_20px_rgba(79,70,229,0.06)]">
          <p className="text-base font-semibold text-gray-900">No candidates yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Submit a CV and job description to run your first AI screening.
          </p>
          <div className="mt-4 flex justify-center">
            <NewCandidateButton />
          </div>
        </div>
      ) : (
        <>
          {/* Metric cards row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Total Candidates" value={stats.total} hint="All submissions" />
            <MetricCard
              title="Screened"
              value={stats.scored}
              hint={`${stats.statuses.pending + stats.statuses.processing} in progress`}
            />
            <MetricCard
              title="Average Score"
              value={stats.averageScore === null ? "—" : stats.averageScore}
              hint="Across screened candidates"
            />
            <MetricCard
              title="Strong Matches"
              value={stats.decisions.strong_match}
              hint="Decision: strong match"
            />
          </div>

          {/* Top candidates + recent candidates */}
          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">
                Top candidates by match score
              </h2>
              {top.length === 0 ? (
                <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                  No screening results yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {top.map((candidate, index) => {
                    const score = candidate.screening_result!.overall_score;
                    return (
                      <Link
                        key={candidate.id}
                        href={`/candidates/${candidate.id}`}
                        className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 transition hover:bg-[#F5F7FF]"
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${RANK_COLOR[index]}`}
                        >
                          {candidate.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {candidate.name}
                          </p>
                          <p className="truncate text-xs text-gray-500">{candidate.position}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${scoreTone(score).text}`}>{score}</p>
                          <span
                            className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${RANK_COLOR[index]}`}
                          >
                            {index + 1}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card className="lg:col-span-3 !p-0">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <h2 className="text-sm font-semibold text-gray-900">Recent candidates</h2>
                <Link
                  href="/candidates"
                  className="text-sm font-semibold text-[#4A90E2] transition hover:text-[#3A7BD5]"
                >
                  View all
                </Link>
              </div>
              <ul className="divide-y divide-gray-50">
                {recent.map((candidate) => {
                  const result = candidate.screening_result;
                  const decision = result ? DECISION_META[result.decision] : null;
                  return (
                    <li key={candidate.id}>
                      <Link
                        href={`/candidates/${candidate.id}`}
                        className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition hover:bg-[#F5F7FF]"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {candidate.name}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {candidate.position} · {formatDate(candidate.created_at)}
                          </p>
                        </div>
                        <StatusBadge status={candidate.status} />
                        {decision && (
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${decision.badge}`}
                          >
                            {decision.label}
                          </span>
                        )}
                        <span className="w-8 text-right text-sm font-bold tabular-nums">
                          {result ? (
                            <span className={scoreTone(result.overall_score).text}>
                              {result.overall_score}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>

          {/* Screening status */}
          <Card>
            <h2 className="text-sm font-semibold text-gray-900">Screening Status</h2>
            <div className="mt-3 flex flex-wrap items-center gap-8">
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.scored}</p>
                <p className="text-xs text-gray-500">Screened</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.statuses.pending + stats.statuses.processing}
                </p>
                <p className="text-xs text-gray-500">In progress</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
                <p className="text-xs text-gray-500">This week</p>
              </div>
            </div>
            <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-gray-100">
              {STATUSES.map((status) => {
                const pct = percentOf(stats.statuses[status], stats.total);
                if (pct === 0) return null;
                return (
                  <div key={status} className={STATUS_COLOR[status]} style={{ width: `${pct}%` }} />
                );
              })}
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-[10px] font-medium text-gray-500">
              {STATUSES.map((status) => (
                <span key={status} className="flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${STATUS_COLOR[status]}`} />
                  {STATUS_LABELS[status]}
                  <span className="font-semibold text-gray-700 tabular-nums">
                    {stats.statuses[status]}
                  </span>
                </span>
              ))}
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-[#EBF3FC] px-3 py-2">
              <span className="mt-0.5 h-4 w-1 shrink-0 rounded-full bg-[#4A90E2]" />
              <p className="text-xs text-gray-600">
                {stats.scored === 0 ? (
                  <>No screenings have completed yet.</>
                ) : (
                  <>
                    <span className="font-semibold text-[#50C878]">
                      {percentOf(stats.decisions.strong_match, stats.scored)}%
                    </span>{" "}
                    of screened candidates came back as a strong match.
                  </>
                )}
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
