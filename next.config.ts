import type { NextConfig } from "next";

// Supabase is the only third-party origin the browser talks to (auth calls).
const supabaseOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
      : "";
  } catch {
    return "";
  }
})();

// Only meaningful behind HTTPS; on a plain-http local server it would make the
// browser upgrade every asset request and fail.
const servedOverHttps = (process.env.NEXT_PUBLIC_APP_URL ?? "").startsWith("https://");

// `next dev` needs eval() for React's debugging tools and a websocket for hot
// reload. Neither is used by a production build, so both stay dev-only.
const isDev = process.env.NODE_ENV !== "production";

// Next injects inline scripts and styles for hydration and next/font, so those
// keep 'unsafe-inline'; everything else is locked to this origin.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin} ${supabaseOrigin.replace(/^https?/, "wss")}${isDev ? " ws: wss:" : ""}`.trim(),
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(servedOverHttps ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // mammoth reads files through Node APIs, so bundling it into the route handler
  // breaks it at runtime. unpdf is serverless-safe and bundles fine, so it is not
  // listed here.
  serverExternalPackages: ["mammoth"],
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
