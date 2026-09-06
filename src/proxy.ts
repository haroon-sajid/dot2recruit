// Refreshes the Supabase session on every request and redirects signed-out users to /login.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Everything under these prefixes needs a session. Unknown paths fall through to
// Next's 404 page instead of bouncing to login; the (app) layout and every API
// route check the session themselves, so a page missing from this list is still
// protected, it just would not redirect from here.
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/new-candidate",
  "/candidates",
  "/positions",
  "/analytics",
  "/interviews",
  "/hiring-assistant",
  "/alerts",
  "/settings",
  "/api",
];

// Reachable without a session: the n8n result callback (shared secret), the
// Vercel cron (its own secret), and the auth code exchange.
const PUBLIC_API = ["/api/webhook/result", "/api/cron/reap-stale"];
const AUTH_PAGES = ["/login", "/signup"];

function startsWithPath(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isProtected(pathname: string) {
  if (PUBLIC_API.some((p) => startsWithPath(pathname, p))) return false;
  return PROTECTED_PREFIXES.some((p) => startsWithPath(pathname, p));
}

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "[supabase] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set",
    );
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser() validates the token with Supabase and refreshes it when needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  if (!user && isProtected(pathname)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  if (user && AUTH_PAGES.includes(pathname)) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/dashboard";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
