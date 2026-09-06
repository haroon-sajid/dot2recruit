// Cron route: fails screenings that never reported back, across all tenants.
// Vercel calls it on the schedule in vercel.json with `Authorization: Bearer $CRON_SECRET`.
// The read endpoints also sweep lazily, so this only matters for tenants nobody is looking at.
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { failStaleScreenings } from "@/lib/stale";

export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const presented = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(presented);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    console.error("[api/cron/reap-stale] CRON_SECRET is not set; refusing to run");
    return NextResponse.json({ error: "Cron not configured" }, { status: 500 });
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const failed = await failStaleScreenings();
    return NextResponse.json({ ok: true, failed });
  } catch (err) {
    console.error("[api/cron/reap-stale] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
