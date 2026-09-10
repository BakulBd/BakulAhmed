import { renderOg, OG_SIZE } from "@/lib/og";
import { site } from "@/lib/content";

export const alt = `Portfolio — ${site.name}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOg({ label: "Portfolio", title: "Selected projects and case studies" });
}
