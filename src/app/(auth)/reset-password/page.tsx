// Reset password: reached from the recovery email. The link is exchanged for a
// session by /auth/callback first, so this page only needs to set the new password.
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { authErrorMessage } from "@/lib/auth-errors";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

const MIN_PASSWORD_LENGTH = 8;

const inputClass =
  "mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#4A90E2] focus:outline-none focus:ring-2 focus:ring-[#4A90E2]/40 disabled:bg-gray-50";

type LinkState = "checking" | "ready" | "invalid";

export default function ResetPasswordPage() {
  const [linkState, setLinkState] = useState<LinkState>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // A recovery session must already exist, either set by /auth/callback or, for
  // email templates that link straight here, carried in the URL.
  useEffect(() => {
    let cancelled = false;
    const supabase = createBrowserSupabaseClient();

    async function check() {
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code).catch(() => null);
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!cancelled) setLinkState(session ? "ready" : "invalid");
    }

    // The implicit flow delivers the session slightly after load.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setLinkState("ready");
    });
    check();
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setSubmitting(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(authErrorMessage(updateError));
        setSubmitting(false);
        return;
      }
      setDone(true);
      // Sign the recovery session out everywhere and ask for a fresh sign-in.
      await fetch("/api/auth/signout", { method: "POST" }).catch(() => null);
      await supabase.auth.signOut({ scope: "local" }).catch(() => null);
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate: full load so the cleared cookies reach proxy.ts.
      window.location.assign("/login?reason=password_updated");
    } catch {
      setError("Could not reach the authentication service. Please try again.");
      setSubmitting(false);
    }
  }

  if (linkState === "checking") {
    return <p className="text-center text-sm text-gray-500">Checking your link…</p>;
  }

  if (linkState === "invalid") {
    return (
      <div className="text-center">
        <h1 className="text-xl font-semibold text-gray-900">This link is no longer valid</h1>
        <p className="mt-2 text-sm text-gray-600">
          Reset links expire after a short while and can only be used once. Open the link in the
          same browser you requested it from, or request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block rounded-lg bg-[#4A90E2] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3A7BD5]"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-semibold text-gray-900">Password updated</h1>
        <p className="mt-2 text-sm text-gray-600">Taking you to sign in…</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Choose a new password</h1>
      <p className="mt-1 text-sm text-gray-600">At least {MIN_PASSWORD_LENGTH} characters.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            New password
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-medium text-gray-400 hover:text-gray-600"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-gray-700">
            Confirm new password
          </label>
          <input
            id="confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={submitting}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-[#4A90E2] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3A7BD5] focus:outline-none focus:ring-2 focus:ring-[#4A90E2]/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
