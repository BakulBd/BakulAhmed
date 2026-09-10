import type { MetadataRoute } from "next";
import { nav, site } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return nav.map((item) => {
    const url = new URL(item.href, site.url).toString();
    return {
      // Match the canonical tags exactly — those emit a bare origin for the
      // home route, so the sitemap must not add a trailing slash.
      url: item.href === "/" ? url.replace(/\/$/, "") : url,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: item.href === "/" ? 1 : 0.8,
    };
  });
}
