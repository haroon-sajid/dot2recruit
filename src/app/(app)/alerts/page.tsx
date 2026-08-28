// Alerts page: placeholder for planned notification and integration features.
import { ComingSoon } from "@/components/coming-soon";

function IconBell() {
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
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export default function AlertsPage() {
  return (
    <ComingSoon
      icon={<IconBell />}
      title="Alerts"
      description="Push screening results to the places your hiring team already works."
      capabilities={[
        "Automatic email notifications to HR when a screening completes.",
        "Slack updates for new results and strong matches.",
        "ATS integration to sync candidates and decisions with your applicant tracking system.",
      ]}
    />
  );
}
