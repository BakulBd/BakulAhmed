import type { MetadataRoute } from "next";
import { site } from "@/lib/content";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — ${site.title}`,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    // Matches the night mood, the default sky.
    background_color: "#08090f",
    theme_color: "#08090f",
    categories: ["portfolio", "technology", "education"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
    shortcuts: [
      { name: "Resume", url: "/resume" },
      { name: "Portfolio", url: "/portfolio" },
      { name: "Contact", url: "/contact" },
    ],
    lang: "en",
    dir: "ltr",
    orientation: "portrait-primary",
  };
}
