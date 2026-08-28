// Client shell: sidebar + main content with collapsible sidebar state.
"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";

export function AppShell({
  children,
  email,
  fullName,
}: {
  children: React.ReactNode;
  email: string | null;
  fullName: string | null;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        email={email}
        fullName={fullName}
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
      />
      <main
        className={`flex-1 overflow-y-auto px-8 py-8 transition-[margin] duration-300 ease-in-out ${
          collapsed ? "ml-[72px]" : "ml-[240px]"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
