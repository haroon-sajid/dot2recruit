// Root layout: global HTML shell, metadata, Inter font, and Tailwind styles.
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Dot2Recruit - AI Recruitment Screening",
  description: "AI-powered candidate screening for recruiters.",
  icons: { icon: "/favicon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // data-scroll-behavior opts route transitions out of the global
    // `scroll-behavior: smooth` in globals.css, so navigation jumps to the top
    // instead of animating there.
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      {/* Browser extensions commonly add attributes to <body> before React
          hydrates (ColorZilla's cz-shortcut-listen, password managers, and so
          on). This silences the resulting mismatch for body's own attributes
          only; children are still checked normally. */}
      <body suppressHydrationWarning className="flex min-h-screen flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
