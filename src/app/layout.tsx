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
    <html lang="en" className={inter.variable}>
      <body className={`flex min-h-screen flex-col font-sans`}>{children}</body>
    </html>
  );
}
