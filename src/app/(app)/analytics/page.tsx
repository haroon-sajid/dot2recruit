// Reports page: screening figures computed from the tenant's real candidate data.
// Visual language matches the rest of the app: soft cards, gradient bars, #EBF3FC callouts.
"use client";

import Link from "next/link";
import { DECISION_META } from "@/components/result-card";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { computeStats, DECISIONS, percentOf, STATUSES } from "@/lib/candidate-stats";
import { useCandidates } from "@/lib/use-candidates";
import type { CandidateStatus, Decision } from "@/types";

const STATUS_LABELS: Record<CandidateStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

// Solid fills for the segmented pipeline bar and its legend dots.
const STATUS_COLOR: Record<CandidateStatus, string> = {
  pending: "bg-gray-300",
  processing: "bg-[#4A90E2]",
  completed: "bg-[#50C878]",
  failed: "bg-[#EF4444]",
};

// Vertical gradient fills, matching the bar-chart treatment used across the app.
const STATUS_GRADIENT: Record<CandidateStatus, string> = {
  pending: "from-gray-300 to-gray-200",
  processing: "from-[#4A90E2] to-[#6BA8E8]",
  completed: "from-[#50C878] to-[#7BD9A0]",
  failed: "from-[#EF4444] to-[#F87171]",
};

const DECISION_GRADIENT: Record<Decision, string> = {
  strong_match: "from-[#50C878] to-[#7BD9A0]",
  potential_match: "from-[#FFA500] to-[#FFC04D]",
  not_a_match: "from-[#EF4444] to-[#F87171]",
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-gray-100 bg-white p-5 shadow-[0_4px_20px_rgba(79,70,229,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Screening activity across your candidates." />
      {children}
    </div>
  );
}

/** Horizontal labelled bar: label, count, share of total, proportional gradient fill. */
function BarRow({
  label,
  count,
  total,
  gradient,
}: {
  label: string;
  count: number;
  total: number;
  gradient: string;
}) {
  const pct = percentOf(count, total);
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="tabular-nums">
          <span className="font-semibold text-gray-900">{count}</span>
          {total > 0 && <span className="ml-2 text-xs text-gray-500">{pct}%</span>}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { candidates, error, loading, reload } = useCandidates();
  const stats = computeStats(candidates ?? []);

  if (error) {
    return (
      <PageShell>
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-[0_4px_20px_rgba(79,70,229,0.06)]"
        >
          <p className="text-sm text-red-800">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 transition hover:bg-gray-50"
          >
            Try again
          </button>
        </div>
      </PageShell>
    );
  }

  if (loading) {
    return (
      <PageShell>
        <div className="rounded-xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-500 shadow-[0_4px_20px_rgba(79,70,229,0.06)]">
          Loading reports…
        </div>
      </PageShell>
    );
  }

  if (stats.total === 0) {
    return (
      <PageShell>
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-[0_4px_20px_rgba(79,70,229,0.06)]">
          <p className="text-base font-semibold text-gray-900">No data yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Screen your first candidate and the numbers will appear here.
          </p>
          <div className="mt-4">
            <Link
              href="/new-candidate"
              className="inline-flex items-center rounded-lg bg-[#4A90E2] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3A7BD5]"
            >
              + Screen Candidate
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  // Vertical bars are scaled against the largest bucket so small sets stay readable.
  const statusPeak = Math.max(...STATUSES.map((s) => stats.statuses[s]), 1);
  const completionPct = percentOf(stats.statuses.completed, stats.total);

  return (
    <PageShell>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Candidates" value={stats.total} hint="All submissions" />
        <MetricCard
          title="Average Score"
          value={stats.averageScore === null ? "—" : stats.averageScore}
          hint={
            stats.scored === 1
              ? "Across 1 screened candidate"
              : `Across ${stats.scored} screened candidates`
          }
        />
        <MetricCard
          title="Screened"
          value={stats.scored}
          hint={`${percentOf(stats.scored, stats.total)}% of all candidates`}
        />
        <MetricCard title="This Week" value={stats.thisWeek} hint="Submitted in the last 7 days" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Decision breakdown */}
        <Card className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-900">Decision Breakdown</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {stats.scored === 0
              ? "No completed screenings yet."
              : `Across ${stats.scored} screened ${stats.scored === 1 ? "candidate" : "candidates"}.`}
          </p>
          <div className="mt-4 space-y-3">
            {DECISIONS.map((decision) => (
              <BarRow
                key={decision}
                label={DECISION_META[decision].label}
                count={stats.decisions[decision]}
                total={stats.scored}
                gradient={DECISION_GRADIENT[decision]}
              />
            ))}
          </div>
        </Card>

        {/* Pipeline chart */}
        <Card className="lg:col-span-3">
          <h2 className="text-sm font-semibold text-gray-900">Screening Pipeline</h2>
          <div className="mt-4 flex items-end gap-4" style={{ height: 160 }}>
            {STATUSES.map((status) => {
              const count = stats.statuses[status];
              const height = Math.round((count / statusPeak) * 100);
              return (
                <div key={status} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-gray-700 tabular-nums">{count}</span>
                  <div
                    className="w-full overflow-hidden rounded-t-md bg-gray-100"
                    style={{ height: 130 }}
                  >
                    <div
                      className={`w-full rounded-t-md bg-gradient-to-t transition-all ${STATUS_GRADIENT[status]}`}
                      style={{ height: `${height}%`, marginTop: `${100 - height}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-gray-500">
                    {STATUS_LABELS[status]}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 rounded-lg bg-[#EBF3FC] px-4 py-2.5 text-xs text-gray-600">
            <span className="font-semibold text-[#4A90E2]">
              {stats.statuses.completed} Completed
            </span>
            {" | "}Completion rate: {completionPct}%
            {stats.statuses.failed > 0 && (
              <>
                {" | "}Failed: <span className="text-[#EF4444]">{stats.statuses.failed}</span>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Status distribution */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-900">Status Distribution</h2>
        <p className="mt-0.5 text-xs text-gray-500">
          Where each of the {stats.total} submitted{" "}
          {stats.total === 1 ? "candidate is" : "candidates are"} in the pipeline.
        </p>
        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-gray-100">
          {STATUSES.map((status) => {
            const pct = percentOf(stats.statuses[status], stats.total);
            if (pct === 0) return null;
            return (
              <div key={status} className={STATUS_COLOR[status]} style={{ width: `${pct}%` }} />
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-[11px] font-medium text-gray-500">
          {STATUSES.map((status) => (
            <span key={status} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${STATUS_COLOR[status]}`} />
              {STATUS_LABELS[status]}
              <span className="font-semibold text-gray-700 tabular-nums">
                {stats.statuses[status]}
              </span>
            </span>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
