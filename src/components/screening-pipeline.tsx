// Animated view of the n8n screening workflow, shown while a candidate is screened.
//
// The workflow only reports pending, processing, completed, and failed, so stage
// progress is derived from those four states. The running stage is deliberately
// indeterminate: it animates to show work is happening without claiming a
// percentage the app has no way to know. Elapsed time is real.
"use client";

import { useEffect, useState } from "react";
import type { CandidateStatus } from "@/types";

/** Mirrors the node chain in n8n/screening-workflow.json. */
const STAGES = [
  {
    key: "submitted",
    label: "CV + JD received",
    detail: "Saved and queued for screening",
    icon: IconInbox,
  },
  {
    key: "prompt",
    label: "Building AI request",
    detail: "Prompt assembled from the CV and JD",
    icon: IconBraces,
  },
  {
    key: "analysis",
    label: "AI analysis",
    detail: "Comparing the CV against the job description",
    icon: IconSparkle,
  },
  {
    key: "validate",
    label: "Scoring and validation",
    detail: "Checking the model returned a usable result",
    icon: IconShieldCheck,
  },
  {
    key: "result",
    label: "Result ready",
    detail: "Score, decision, and analysis stored",
    icon: IconFlag,
  },
] as const;

// While the workflow runs, everything up to this stage is treated as done and
// this one is the active one. The stages after it have genuinely not happened.
const RUNNING_STAGE_INDEX = 2;

type StageState = "done" | "active" | "pending" | "failed";

function IconInbox() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

function IconBraces() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1" />
      <path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1" />
    </svg>
  );
}

function IconSparkle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
      <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
    </svg>
  );
}

function IconShieldCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function IconFlag() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="8" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/** Which visual state each stage is in, given the candidate's real status. */
function stageStates(status: CandidateStatus): StageState[] {
  return STAGES.map((_, index) => {
    if (status === "completed") return "done";
    if (status === "failed") {
      if (index < RUNNING_STAGE_INDEX) return "done";
      if (index === RUNNING_STAGE_INDEX) return "failed";
      return "pending";
    }
    if (status === "pending") return index === 0 ? "active" : "pending";
    // processing
    if (index < RUNNING_STAGE_INDEX) return "done";
    if (index === RUNNING_STAGE_INDEX) return "active";
    return "pending";
  });
}

const NODE_STYLE: Record<StageState, string> = {
  done: "border-[#50C878] bg-[#E8F8EF] text-[#2E8B57]",
  active: "border-[#4A90E2] bg-[#EBF3FC] text-[#4A90E2] animate-pipeline-halo",
  pending: "border-gray-200 bg-white text-gray-300",
  failed: "border-[#EF4444] bg-[#FEE2E2] text-[#DC2626]",
};

const LABEL_STYLE: Record<StageState, string> = {
  done: "text-gray-900",
  active: "text-[#4A90E2]",
  pending: "text-gray-400",
  failed: "text-[#DC2626]",
};

function formatElapsed(ms: number) {
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

/** Counts up while the screening runs. Stops as soon as it is no longer running. */
function useElapsed(running: boolean) {
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);

  return running ? now - startedAt : 0;
}

export function ScreeningPipeline({ status }: { status: CandidateStatus }) {
  const running = status === "pending" || status === "processing";
  const elapsed = useElapsed(running);
  const states = stageStates(status);

  const headline =
    status === "completed"
      ? "Screening complete"
      : status === "failed"
        ? "Screening failed"
        : "Screening in progress";

  const subline =
    status === "completed"
      ? "The result is ready below."
      : status === "failed"
        ? "The workflow could not finish. Nothing was scored."
        : "Your CV and job description are moving through the AI workflow.";

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-[0_4px_20px_rgba(79,70,229,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{headline}</h3>
          <p className="mt-0.5 text-xs text-gray-500">{subline}</p>
        </div>
        {running && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF3FC] px-2.5 py-1 text-xs font-semibold text-[#4A90E2] tabular-nums">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4A90E2]" />
            {formatElapsed(elapsed)}
          </span>
        )}
      </div>

      {/* Stage rail. Horizontal on wide screens, stacked below md. */}
      <ol className="mt-6 flex flex-col gap-4 md:flex-row md:items-start md:gap-0">
        {STAGES.map((stage, index) => {
          const state = states[index];
          const Icon = stage.icon;
          const connectorActive = states[index + 1] === "active";
          const connectorDone = states[index + 1] === "done";

          return (
            <li key={stage.key} className="flex gap-4 md:flex-1 md:flex-col md:gap-0">
              {/* Node + connector */}
              <div className="flex flex-col items-center md:w-full md:flex-row">
                <div
                  className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 transition-colors duration-500 ${NODE_STYLE[state]}`}
                >
                  <span className="h-5 w-5">
                    <Icon />
                  </span>
                  {state === "done" && (
                    <span className="animate-pipeline-pop absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#50C878] text-white">
                      <IconCheck />
                    </span>
                  )}
                  {state === "failed" && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#EF4444] text-white">
                      <IconAlert />
                    </span>
                  )}
                </div>

                {index < STAGES.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={`my-1 w-0.5 flex-1 rounded-full md:my-0 md:mx-2 md:h-0.5 md:w-auto ${
                      connectorActive
                        ? "animate-pipeline-flow"
                        : connectorDone
                          ? "bg-[#50C878]"
                          : "bg-gray-200"
                    }`}
                    style={{ minHeight: 20 }}
                  />
                )}
              </div>

              {/* Label */}
              <div className="min-w-0 pb-2 md:mt-3 md:pr-4">
                <p className={`text-xs font-semibold transition-colors ${LABEL_STYLE[state]}`}>
                  {stage.label}
                </p>
                <p className="mt-0.5 text-[11px] leading-4 text-gray-400">{stage.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {running && (
        <p className="mt-4 rounded-lg bg-gray-50 px-4 py-2.5 text-xs text-gray-500">
          This usually takes under a minute. The page updates on its own, so you can leave it open.
        </p>
      )}
    </div>
  );
}
