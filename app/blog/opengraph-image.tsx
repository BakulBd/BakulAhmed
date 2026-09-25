import { renderOg, OG_SIZE } from "@/lib/og";
import { blog, site } from "@/lib/content";

export const alt = `Blog — ${site.name}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOg({ label: "Blog", title: blog.heading, meta: "Netcode, applied AI and shipping full-stack products" });
}
