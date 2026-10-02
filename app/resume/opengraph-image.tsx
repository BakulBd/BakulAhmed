import { renderOg, OG_SIZE } from "@/lib/og";
import { education, experience, site } from "@/lib/content";

export const alt = `Resume of ${site.name}: education, experience and skills`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOg({
    variant: "profile",
    label: "Resume",
    title: "Education, experience and skills",
    chips: ["B.Sc. CSE · CGPA 3.96", education[0].org, `${experience[0].title}, GUCC`],
  });
}
