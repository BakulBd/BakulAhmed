import { renderOg, OG_SIZE } from "@/lib/og";
import { site } from "@/lib/content";

export const alt = `${site.name} — ${site.title}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOg({ label: site.title, title: "Computer Science Engineer & Technology Builder" });
}
