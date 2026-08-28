import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
