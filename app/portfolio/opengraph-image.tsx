import { renderOg, OG_SIZE } from "@/lib/og";
import { projects, site } from "@/lib/content";

export const alt = `Projects by ${site.name}: ${projects.map((p) => p.name).join(", ")}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOg({
    variant: "projects",
    label: "Portfolio",
    title: "Multiplayer, AI and developer tools",
    projects: projects.map((p) => ({ name: p.name, subtitle: p.category, image: p.image })),
  });
}
