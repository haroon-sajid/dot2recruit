// Forgot password: sends the Supabase recovery email. The link lands on /reset-password.
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { authErrorMessage } from "@/lib/auth-errors";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

const inputClass =
  "mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#4A90E2] focus:outline-none focus:ring-2 focus:ring-[#4A90E2]/40 disabled:bg-gray-50";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (resetError) {
        setError(authErrorMessage(resetError));
        setSubmitting(false);
        return;
      }
      // Same message whether or not the address has an account.
      setSent(true);
    } catch {
      setError("Could not reach the authentication service. Please try again.");
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-semibold text-gray-900">Check your email</h1>
        <p className="mt-2 text-sm text-gray-600">
          If an account exists for <span className="font-medium">{email.trim()}</span>, we sent a
          link to reset the password. It expires after a short while, so open it soon.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-semibold text-[#4A90E2] transition hover:text-[#3A7BD5]"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Reset your password</h1>
      <p className="mt-1 text-sm text-gray-600">
        Enter the email you signed up with and we will send you a reset link.
      </p>

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
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-[#4A90E2] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3A7BD5] focus:outline-none focus:ring-2 focus:ring-[#4A90E2]/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-[#4A90E2] transition hover:text-[#3A7BD5]">
          Sign in
        </Link>
      </p>
    </div>
  );
}
