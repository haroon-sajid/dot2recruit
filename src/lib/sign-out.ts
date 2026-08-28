// Shared sign-out used by every logout control.
"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

// The browser call to Supabase can hang; logging out must not depend on it.
const SIGNOUT_TIMEOUT_MS = 5_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

/**
 * Clears the session and returns to the login page.
 *
 * Order matters. The server route runs first because it is the one that can
 * reliably expire the auth cookies, by writing them onto its own response. The
 * browser call afterwards clears local storage and in-memory state. Both are
 * time-boxed, and navigation happens regardless, so a slow or failing network
 * can never leave the user stuck on a "Signing out…" button.
 */
export async function signOutAndRedirect() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SIGNOUT_TIMEOUT_MS);
    await fetch("/api/auth/signout", { method: "POST", signal: controller.signal });
    clearTimeout(timer);
  } catch (err) {
    console.error("[auth] Server sign out failed:", err);
  }

  try {
    await withTimeout(
      createBrowserSupabaseClient().auth.signOut({ scope: "local" }),
      SIGNOUT_TIMEOUT_MS,
    );
  } catch (err) {
    console.error("[auth] Local sign out failed:", err);
  }

  // Full page load: no client router cache, and the request carries the now
  // expired cookies so the proxy sees a signed-out user.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate: a soft navigation would keep the cached signed-in tree.
  window.location.assign("/login");
}
