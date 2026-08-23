import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["pg-cloudflare"],
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};
export default nextConfig;
