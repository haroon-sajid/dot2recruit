// Client shell: sidebar + main content. The sidebar collapses to an icon rail on
// desktop (remembered between visits) and becomes an off-canvas drawer below lg.
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";

const COLLAPSED_KEY = "recruitai:sidebar-collapsed";
const DESKTOP_QUERY = "(min-width: 1024px)";

function IconMenu() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function AppShell({
  children,
  email,
  fullName,
}: {
  children: React.ReactNode;
  email: string | null;
  fullName: string | null;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Both values are only knowable in the browser; reading them in an effect
  // keeps the server and first client render identical.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
    } catch {
      // Storage unavailable: start expanded.
    }
    const media = window.matchMedia(DESKTOP_QUERY);
    setIsDesktop(media.matches);
    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  // Navigating closes the drawer.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  function toggleCollapsed() {
    setCollapsed((v) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, v ? "0" : "1");
      } catch {
        // Remembering the state is a convenience only.
      }
      return !v;
    });
  }

  // The icon rail is a desktop layout; the drawer always shows labels.
  const railCollapsed = collapsed && isDesktop;

  return (
    <div className="flex min-h-screen">
      <Sidebar
        email={email}
        fullName={fullName}
        collapsed={railCollapsed}
        onToggle={toggleCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {mobileOpen && (
        <div
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-gray-900/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <div
        className={`flex min-w-0 flex-1 flex-col transition-[margin] duration-300 ease-in-out ${
          railCollapsed ? "lg:ml-[72px]" : "lg:ml-[240px]"
        }`}
      >
        {/* Mobile top bar: the only way to reach the drawer below lg. */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4A90E2]/40"
          >
            <IconMenu />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/favicon.png"
              alt="Dot2Recruit logo"
              width={28}
              height={28}
              className="h-7 w-7 rounded-md object-contain"
            />
            <span className="text-base font-bold tracking-tight text-gray-900">Dot2Recruit</span>
          </Link>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
