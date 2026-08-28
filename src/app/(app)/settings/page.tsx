// Settings page: the signed-in user's account details (from GET /api/me) and sign out.
"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { signOutAndRedirect } from "@/lib/sign-out";
import type { MeResponse } from "@/types";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-[0_4px_20px_rgba(79,70,229,0.06)]">
      {children}
    </div>
  );
}

/** One read-only account field. Values come from the database, not editable here yet. */
function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-50 py-3 last:border-0">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm font-semibold text-gray-900">
        {value ?? <span className="font-normal italic text-gray-400">Not set</span>}
      </dd>
    </div>
  );
}

export default function SettingsPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as
          | (MeResponse & { error?: string })
          | null;
        if (cancelled) return;
        if (!res.ok || !data) {
          setError(data?.error ?? "Failed to load your account details.");
          return;
        }
        setMe(data);
      } catch {
        if (!cancelled) {
          setError("Could not reach the server. Check your connection and try again.");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await signOutAndRedirect();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Your account and workspace details." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold text-gray-900">Account</h2>
          {error ? (
            <p role="alert" className="mt-4 text-sm text-red-700">
              {error}
            </p>
          ) : me === null ? (
            <p className="mt-4 text-sm text-gray-500">Loading…</p>
          ) : (
            <dl className="mt-2">
              <Field label="Email" value={me.email} />
              <Field label="Full name" value={me.fullName} />
              <Field label="Company" value={me.companyName} />
            </dl>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-gray-900">Session</h2>
          <p className="mt-1 text-sm text-gray-500">
            Sign out of Dot2Recruit on this device.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-4 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingOut ? "Signing out…" : "Log out"}
          </button>
        </Card>
      </div>
    </div>
  );
}
