import { renderOg, OG_SIZE } from "@/lib/og";
import { site } from "@/lib/content";

export const alt = `Resume — ${site.name}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOg({ label: "Resume", title: "Education, experience and skills" });
}
