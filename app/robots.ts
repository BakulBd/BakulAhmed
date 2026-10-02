import type { MetadataRoute } from "next";
import { site } from "@/lib/content";

export default function robots(): MetadataRoute.Robots {
  return {
    // The contact endpoint is a form target, not a page.
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: `${site.url.replace(/\/$/, "")}/sitemap.xml`,
  };
}
