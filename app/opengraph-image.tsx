import { renderOg, OG_SIZE } from "@/lib/og";
import { profile, site, stats } from "@/lib/content";

export const alt = `${site.name} — ${site.title}. ${profile.status}.`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOg({
    variant: "profile",
    label: profile.status,
    title: site.title,
    // The figures from the home page, so a shared link carries the proof.
    chips: stats.slice(0, 3).map((s) => `${s.value.toFixed(s.decimals ?? 0)}${s.suffix} ${s.label}`),
  });
}
