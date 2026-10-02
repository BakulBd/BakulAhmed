import { renderOg, OG_SIZE } from "@/lib/og";
import { contact, contactDetails, site } from "@/lib/content";

export const alt = `Contact ${site.name}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  const email = contactDetails.find((c) => c.label === "Email")?.value ?? "";
  return renderOg({
    variant: "profile",
    label: "Contact",
    title: contact.heading,
    chips: [email, "Dhaka · GMT+6", "Internships · research · collaboration"],
  });
}
