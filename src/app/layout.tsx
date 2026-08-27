// Root layout: wraps every page with the global HTML shell, header nav, and Tailwind styles.
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "RecruitAI - AI Recruitment Screening",
  description: "AI-powered candidate screening for recruiters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-semibold tracking-tight text-gray-900"
            >
              <span
                aria-hidden="true"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-sm font-bold text-white"
              >
                R
              </span>
              RecruitAI
            </Link>
            <nav className="flex items-center gap-1 text-sm font-medium">
              <Link
                href="/candidates"
                className="rounded-md px-3 py-1.5 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
              >
                Candidates
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
