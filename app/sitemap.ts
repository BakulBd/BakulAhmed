import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/blog";
import { nav, profile } from "@/lib/content";
import { abs } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPosts();
  const now = new Date();
  const latestPost = posts[0] ? new Date(posts[0].updated ?? posts[0].date) : now;

  const pages: MetadataRoute.Sitemap = nav.map((item) => ({
    // abs() drops the trailing slash, so the home entry is the bare origin —
    // exactly what its canonical tag says.
    url: abs(item.href),
    lastModified: item.href === "/blog" ? latestPost : now,
    changeFrequency: item.href === "/blog" ? "weekly" : "monthly",
    priority: item.href === "/" ? 1 : 0.8,
    // Image sitemap: the portrait is on every page, but it belongs to the home
    // page — that is the one to show for a search on the name.
    ...(item.href === "/" ? { images: [abs(profile.image.src)] } : {}),
  }));

  const articles: MetadataRoute.Sitemap = posts.map((p) => ({
    url: abs(`/blog/${p.slug}`),
    lastModified: new Date(p.updated ?? p.date),
    changeFrequency: "yearly",
    priority: 0.7,
    images: [abs(`/blog/${p.slug}/opengraph-image`)],
  }));

  return [...pages, ...articles];
}
