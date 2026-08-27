// Home page: landing view where a recruiter submits a candidate for screening.
import Link from "next/link";
import { CandidateForm } from "@/components/candidate-form";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">RecruitAI</h1>
        <p className="mt-2 text-gray-600">
          Paste a CV and a job description — get an AI screening score, decision, and
          interview recommendation in under a minute.
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <CandidateForm />
      </div>

      <p className="mt-6 text-center text-sm text-gray-600">
        <Link href="/candidates" className="font-medium text-indigo-600 hover:text-indigo-500">
          View all candidates →
        </Link>
      </p>
    </div>
  );
}
