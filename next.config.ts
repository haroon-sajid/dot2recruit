import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse pulls in pdfjs-dist and the @napi-rs/canvas native binary, and
  // mammoth reads files through Node APIs. Bundling either into the route
  // handler breaks them at runtime, so load both with a native require.
  serverExternalPackages: ["pdf-parse", "mammoth"],
};

export default nextConfig;
