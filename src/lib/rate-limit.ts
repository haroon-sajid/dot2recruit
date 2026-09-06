// In-memory sliding-window limiter for the write endpoints.
//
// Scope: per user, per server instance. On serverless hosting each instance
// keeps its own counters, so this bounds abuse from a single session rather
// than acting as a global quota. It needs no extra infrastructure and is
// enough to stop a runaway client from burning AI credits.
import { NextResponse } from "next/server";

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();
const SWEEP_EVERY_MS = 60_000;
let lastSweep = Date.now();

function sweep(now: number, windowMs: number) {
  if (now - lastSweep < SWEEP_EVERY_MS) return;
  lastSweep = now;
  for (const [key, win] of buckets) {
    win.timestamps = win.timestamps.filter((t) => now - t < windowMs);
    if (win.timestamps.length === 0) buckets.delete(key);
  }
}

export interface RateLimitRule {
  /** Identifies the action, e.g. "screen". */
  name: string;
  limit: number;
  windowMs: number;
}

export const RATE_LIMITS = {
  screen: { name: "screen", limit: 20, windowMs: 60_000 },
  extract: { name: "extract", limit: 30, windowMs: 60_000 },
  savePosition: { name: "position", limit: 30, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitRule>;

/** Records one hit and reports whether the caller is over the rule's limit. */
export function checkRateLimit(subject: string, rule: RateLimitRule): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  sweep(now, rule.windowMs);
  const key = `${rule.name}:${subject}`;
  const win = buckets.get(key) ?? { timestamps: [] };
  win.timestamps = win.timestamps.filter((t) => now - t < rule.windowMs);
  if (win.timestamps.length >= rule.limit) {
    buckets.set(key, win);
    const retryAfterSec = Math.max(1, Math.ceil((win.timestamps[0] + rule.windowMs - now) / 1000));
    return { ok: false, retryAfterSec };
  }
  win.timestamps.push(now);
  buckets.set(key, win);
  return { ok: true, retryAfterSec: 0 };
}

/** 429 response with a plain-language message and a Retry-After header. */
export function rateLimitedResponse(retryAfterSec: number) {
  return NextResponse.json(
    { error: "You are doing that too quickly. Please wait a moment and try again." },
    { status: 429, headers: { "retry-after": String(retryAfterSec) } },
  );
}
