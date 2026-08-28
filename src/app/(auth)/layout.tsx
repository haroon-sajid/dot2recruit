// Auth layout: minimal centered card for login and signup, no sidebar.
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-2 flex items-center justify-center gap-2.5 text-xl font-semibold tracking-tight text-gray-900 transition hover:opacity-80">
          <Image
            src="/favicon.png"
            alt="Dot2Recruit"
            width={36}
            height={36}
            className="h-9 w-9 rounded-md object-contain"
          />
          Dot2Recruit
        </Link>
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4A90E2] transition hover:text-[#3A7BD5]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to landing page
          </Link>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-[0_4px_20px_rgba(79,70,229,0.06)] sm:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}
