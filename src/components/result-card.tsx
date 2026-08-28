// Component: displays a candidate's AI screening result (score, decision, analysis sections).
import type { Decision, ScreeningResult } from "@/types";

export const DECISION_META: Record<Decision, { label: string; badge: string }> = {
  strong_match: {
    label: "Strong Match",
    badge: "bg-[#E8F8EF] text-[#2E8B57] ring-[#50C878]/30",
  },
  potential_match: {
    label: "Potential Match",
    badge: "bg-[#FFF4E0] text-[#CC8400] ring-[#FFA500]/30",
  },
  not_a_match: {
    label: "Not a Match",
    badge: "bg-[#FEE2E2] text-[#DC2626] ring-[#EF4444]/30",
  },
};

/** Text + ring colour for a 0-100 score: green >= 75, yellow 50-74, red < 50. */
export function scoreTone(score: number): { text: string; stroke: string } {
  if (score >= 75) return { text: "text-[#50C878]", stroke: "stroke-[#50C878]" };
  if (score >= 50) return { text: "text-[#FFA500]", stroke: "stroke-[#FFA500]" };
  return { text: "text-[#EF4444]", stroke: "stroke-[#EF4444]" };
}

function ScoreRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const tone = scoreTone(clamped);

  return (
    <div
      className="relative h-32 w-32 shrink-0"
      role="img"
      aria-label={`Overall score ${clamped} out of 100`}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="9" className="stroke-gray-100" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={tone.stroke}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold leading-none ${tone.text}`}>{clamped}</span>
        <span className="mt-1 text-xs text-gray-400">/ 100</span>
      </div>
    </div>
  );
}

function TextSection({ title, body }: { title: string; body: string | null }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {body ? (
        <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-gray-600">{body}</p>
      ) : (
        <p className="mt-1.5 text-sm italic text-gray-400">Not provided</p>
      )}
    </section>
  );
}

function ListSection({
  title,
  items,
  bullet,
}: {
  title: string;
  items: string[] | null;
  bullet: string;
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {items && items.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {items.map((item, index) => (
            <li key={`${index}-${item}`} className="flex gap-2 text-sm text-gray-600">
              <span
                aria-hidden="true"
                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${bullet}`}
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 text-sm italic text-gray-400">None identified</p>
      )}
    </section>
  );
}

function InterviewChip({ value }: { value: boolean | null }) {
  if (value === null) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-500 ring-1 ring-inset ring-gray-200">
        Not specified
      </span>
    );
  }
  return value ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F8EF] px-3 py-1 text-sm font-medium text-[#2E8B57] ring-1 ring-inset ring-[#50C878]/30">
      <span aria-hidden="true">✓</span> Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 ring-1 ring-inset ring-gray-200">
      <span aria-hidden="true">✕</span> No
    </span>
  );
}

export function ResultCard({ result }: { result: ScreeningResult }) {
  const decision = DECISION_META[result.decision] ?? DECISION_META.not_a_match;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_4px_20px_rgba(79,70,229,0.06)]">
      <div className="flex flex-col gap-6 border-b border-gray-100 p-6 sm:flex-row sm:items-center">
        <ScoreRing score={result.overall_score} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Screening decision
          </p>
          <span
            className={`mt-1.5 inline-flex items-center rounded-full px-3 py-1 text-base font-semibold ring-1 ring-inset ${decision.badge}`}
          >
            {decision.label}
          </span>
          <p className="mt-3 text-sm leading-6 text-gray-600">{result.decision_reason}</p>
        </div>
      </div>

      <div className="grid gap-6 p-6 md:grid-cols-2">
        <TextSection title="Relevant Experience" body={result.relevant_experience} />
        <TextSection title="Technical Skills Match" body={result.technical_skills_match} />
        <TextSection title="Education Match" body={result.education_match} />
        <ListSection title="Missing Skills" items={result.missing_skills} bullet="bg-[#EF4444]" />
        <ListSection title="Strengths" items={result.strengths} bullet="bg-[#50C878]" />
        <ListSection title="Concerns" items={result.concerns} bullet="bg-[#FFA500]" />
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
        <span className="text-sm font-semibold text-gray-900">Interview recommended</span>
        <InterviewChip value={result.interview_recommended} />
      </div>
    </div>
  );
}
