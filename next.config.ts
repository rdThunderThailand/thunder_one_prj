import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This machine has a `pnpm-lock.yaml` one directory up (`/Users/nie/`) plus
  // this project's own `pnpm-workspace.yaml`, so Turbopack's root inference
  // picks the wrong (outer) directory and warns on every dev-server start.
  // Concretely broke: `public/` files added after the very first compile
  // (e.g. a new template under `public/templates/`) 307-redirected to
  // /login — the (dashboard) layout's own catch-all auth check, not a static
  // file 404 — instead of being served, since Turbopack was resolving
  // `public/` against the wrong root. Pinning the root to this project
  // directory (Next's own suggested fix) resolves both the warning and that
  // bug.
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    // Turbopack's dev filesystem cache is on by default since Next 16.1 and
    // has no size cap or eviction, so `.next/dev/cache` grows unbounded over
    // a long dev session and eventually OOMs the node process. Disable it.
    turbopackFileSystemCacheForDev: false,
  },
  // Redirect-only index routes, resolved here before any rendering. As
  // page.tsx redirects they first ran the whole (dashboard) layout — three
  // sequential Core calls in getSession() — only to throw the render away,
  // roughly doubling time-to-first-byte for every tile/sidebar link to them.
  // The page.tsx files stay as a fallback.
  async redirects() {
    return [
      { source: "/asset-intelligence", destination: "/asset-intelligence/assets", permanent: false },
      { source: "/thunder-care", destination: "/thunder-care/work-orders", permanent: false },
      { source: "/media-workspace/compositions", destination: "/media-workspace/layouts", permanent: false },
      { source: "/media-workspace/compositions/create", destination: "/media-workspace/layouts/create", permanent: false },
    ];
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
  allowedDevOrigins: ["192.168.1.36"],
};

export default nextConfig;
