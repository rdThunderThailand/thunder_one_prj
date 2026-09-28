import type { MetadataRoute } from "next";

// Only the public sign-in page is meant for search engines; everything else
// is behind login (and additionally marked noindex in the dashboard layout).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/login", "/opengraph-image"], disallow: "/" }],
  };
}
