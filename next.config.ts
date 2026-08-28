import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // mammoth reads files through Node APIs, so bundling it into the route handler
  // breaks it at runtime. unpdf is serverless-safe and bundles fine, so it is not
  // listed here.
  serverExternalPackages: ["mammoth"],
};

export default nextConfig;
