import { renderOg, OG_SIZE } from "@/lib/og";
import { site } from "@/lib/content";

export const alt = `Contact — ${site.name}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOg({ label: "Contact", title: "Let’s build something useful." });
}
