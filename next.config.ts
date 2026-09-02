import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Turbopack's dev filesystem cache is on by default since Next 16.1 and
    // has no size cap or eviction, so `.next/dev/cache` grows unbounded over
    // a long dev session and eventually OOMs the node process. Disable it.
    turbopackFileSystemCacheForDev: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/sign/**",
        // no `search`: signed URLs carry a rotating token/expiry query string,
        // so an exact-match pattern would break on every request.
      },
    ],
  },
};

export default nextConfig;
