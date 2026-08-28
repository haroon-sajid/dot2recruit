// Hiring Assistant page: placeholder for the planned adaptive screening assistant.
import { ComingSoon } from "@/components/coming-soon";

function IconAssistant() {
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
      <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
      <line x1="9" y1="21" x2="15" y2="21" />
    </svg>
  );
}

export default function HiringAssistantPage() {
  return (
    <ComingSoon
      icon={<IconAssistant />}
      title="Hiring Assistant"
      description="An AI assistant that learns how your team hires and screens candidates smarter over time."
      capabilities={[
        "Learns your company's hiring preferences from the roles and requirements you screen against.",
        "Builds on your past accept and reject decisions to sharpen future scoring.",
        "Applies that context to every new screening, so recommendations improve as you use it.",
      ]}
    />
  );
}
