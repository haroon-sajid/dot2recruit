// Shared placeholder for planned features: icon, title, description, badge, and roadmap list.
import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/page-header";

function IconCheck() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function ComingSoon({
  icon,
  title,
  description,
  capabilities,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  capabilities: string[];
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={description} />

      <div className="max-w-2xl rounded-xl border border-gray-100 bg-white p-8 shadow-[0_4px_20px_rgba(79,70,229,0.06)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EBF3FC] text-[#4A90E2]">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              <span className="inline-flex items-center rounded-full bg-[#FFF4E0] px-2.5 py-0.5 text-xs font-semibold text-[#CC8400] ring-1 ring-inset ring-[#FFA500]/30">
                Coming Soon
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Planned capabilities
          </h3>
          <ul className="mt-3 space-y-2.5">
            {capabilities.map((capability) => (
              <li key={capability} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                  <IconCheck />
                </span>
                <span className="leading-6">{capability}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-500">
          This page is a placeholder for an upcoming feature. Nothing here is active yet.
        </p>
      </div>
    </div>
  );
}
