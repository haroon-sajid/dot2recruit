// Interviews page: placeholder for planned interview scheduling features.
import { ComingSoon } from "@/components/coming-soon";

function IconCalendar() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export default function InterviewsPage() {
  return (
    <ComingSoon
      icon={<IconCalendar />}
      title="Interviews"
      description="Schedule and track interviews for the candidates who clear AI screening."
      capabilities={[
        "Interview scheduling — book, reschedule, and track interviews against each candidate record.",
        "Automatic interview recommendations based on the candidate's AI match score.",
      ]}
    />
  );
}
