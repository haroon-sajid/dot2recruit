// Component: shows the signed-in user's email with a logout button.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

export function UserMenu({ email }: { email: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await createBrowserSupabaseClient().auth.signOut();
    } catch (err) {
      console.error("[auth] Sign out failed:", err);
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 border-l border-gray-200 pl-3">
      {email && (
        <span className="hidden max-w-[16rem] truncate text-sm text-gray-500 sm:inline" title={email}>
          {email}
        </span>
      )}
      <button
        type="button"
        onClick={logout}
        disabled={busy}
        className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-60"
      >
        {busy ? "Signing out…" : "Log out"}
      </button>
    </div>
  );
}
