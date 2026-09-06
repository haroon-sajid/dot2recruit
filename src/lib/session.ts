// Client helper: a 401 from our own API means the session ended; send the user back to sign in.
"use client";

export const LOGIN_EXPIRED_PATH = "/login?reason=expired";

/**
 * True (and navigates to the login page) when the response is a 401.
 * Callers return early after this so they never show "Unauthorized" as an error.
 */
export function handleSessionExpired(res: Response): boolean {
  if (res.status !== 401) return false;
  // Full page load: clears the client router cache of signed-in pages.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate: the session is gone, a soft navigation would keep cached signed-in pages.
  window.location.assign(LOGIN_EXPIRED_PATH);
  return true;
}
