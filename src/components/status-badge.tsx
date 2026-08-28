// Component: colored badge showing a candidate's screening status (pending / processing / completed / failed).
import type { CandidateStatus } from "@/types";

const STATUS_META: Record<
  CandidateStatus,
  { label: string; badge: string; dot: string }
> = {
  pending: {
    label: "Pending",
    badge: "bg-gray-100 text-gray-600 ring-gray-200",
    dot: "bg-gray-400",
  },
  processing: {
    label: "Processing",
    badge: "bg-[#EBF3FC] text-[#4A90E2] ring-[#4A90E2]/20",
    dot: "bg-[#4A90E2] animate-pulse",
  },
  completed: {
    label: "Completed",
    badge: "bg-[#E8F8EF] text-[#2E8B57] ring-[#50C878]/20",
    dot: "bg-[#50C878]",
  },
  failed: {
    label: "Failed",
    badge: "bg-[#FEE2E2] text-[#DC2626] ring-[#EF4444]/20",
    dot: "bg-[#EF4444]",
  },
};

export function StatusBadge({ status }: { status: CandidateStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${meta.badge}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}
