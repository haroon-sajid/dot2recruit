// Reusable metric card: title, large value, optional trend arrow, optional hint.
// Omit `trend` when there is no measured change to show — an arrow with no real
// delta behind it reads as data the app does not actually have.
export function MetricCard({
  title,
  value,
  trend,
  trendUp,
  hint,
}: {
  title: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-[0_4px_20px_rgba(79,70,229,0.06)]">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <div className="mt-2 flex items-end gap-3">
        <p className="text-3xl font-bold tracking-tight text-gray-900">{value}</p>
        {trend && (
          <span
            className={`mb-1 flex items-center gap-0.5 text-xs font-semibold ${
              trendUp ? "text-[#50C878]" : "text-[#FFA500]"
            }`}
          >
            {trendUp ? (
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
              </svg>
            )}
            {trend}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
