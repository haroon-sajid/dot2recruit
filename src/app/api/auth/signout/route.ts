// API route: signs the user out server-side so the auth cookies are cleared on
// the response itself.
//
// Clearing them from the browser alone is not reliable: it only reaches cookies
// JavaScript can see, and the network call it makes can hang, leaving the
// session intact and the proxy still treating the user as signed in.
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    // Writes the expired auth cookies onto this response.
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("[api/auth/signout] Sign out reported an error:", error);
    }
  } catch (err) {
    // Even on failure the client still navigates to /login, and the proxy will
    // send the user back here if a session somehow survived.
    console.error("[api/auth/signout] Unhandled error:", err);
  }

  return NextResponse.json({ ok: true });
}
