// Auth callback: turns the code or token in a Supabase email link (signup
// confirmation, password recovery) into a session cookie, then continues to `next`.
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const OTP_TYPES: EmailOtpType[] = ["signup", "recovery", "email_change", "email", "magiclink", "invite"];

/** Only same-origin paths; anything else falls back to the dashboard. */
function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const failure = new URL(next === "/reset-password" ? "/forgot-password" : "/login", origin);
  failure.searchParams.set("reason", "link_invalid");

  try {
    const supabase = await createServerSupabaseClient();

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("[auth/callback] Code exchange failed:", error.message);
        return NextResponse.redirect(failure);
      }
      return NextResponse.redirect(new URL(next, origin));
    }

    if (tokenHash && type && OTP_TYPES.includes(type)) {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
      if (error) {
        console.error("[auth/callback] Token verification failed:", error.message);
        return NextResponse.redirect(failure);
      }
      return NextResponse.redirect(new URL(next, origin));
    }
  } catch (err) {
    console.error("[auth/callback] Unhandled error:", err);
  }

  return NextResponse.redirect(failure);
}
