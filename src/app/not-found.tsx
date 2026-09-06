// Branded 404 for any URL that does not exist, signed in or not.
import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 text-xl font-semibold tracking-tight text-gray-900 transition hover:opacity-80">
          <Image
            src="/favicon.png"
            alt="Dot2Recruit"
            width={36}
            height={36}
            className="h-9 w-9 rounded-md object-contain"
          />
          Dot2Recruit
        </Link>
        <div className="mt-6 rounded-xl border border-gray-100 bg-white p-8 shadow-[0_4px_20px_rgba(79,70,229,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">404</p>
          <h1 className="mt-2 text-xl font-semibold text-gray-900">We can&apos;t find that page</h1>
          <p className="mt-2 text-sm text-gray-600">
            The link may be out of date, or the page may have moved.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-lg bg-[#4A90E2] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3A7BD5]"
            >
              Go to dashboard
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 transition hover:bg-gray-50"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
