// Screen Candidate page: the screening submission form (CV + JD -> AI screening).
import { CandidateForm } from "@/components/candidate-form";
import { PageHeader } from "@/components/ui/page-header";

export default function NewCandidatePage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Screen Candidate"
        subtitle="Submit a CV and job description to start an AI screening."
      />

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-[0_4px_20px_rgba(79,70,229,0.06)]">
        <CandidateForm />
      </div>
    </div>
  );
}
