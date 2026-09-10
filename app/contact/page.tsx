import type { Metadata } from "next";
import Card from "@/components/card";
import ContactForm from "@/components/contact-form";
import { iconMap, type IconName } from "@/components/icons";
import { PageHeading, SectionHeading } from "@/components/page-heading";
import { contact, contactDetails, socials } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Bakul Ahmed about opportunities, projects and collaboration.",
  alternates: { canonical: "/contact" },
};

const email = contactDetails.find((item) => item.label === "Email")?.value ?? "";

export default function ContactPage() {
  return (
    <>
      <PageHeading>Contact</PageHeading>

      <Card>
        <h2 className="max-w-xl text-[1.7rem] font-bold leading-tight tracking-[-0.03em] text-fg md:text-[2.2rem]">
          {contact.heading}
        </h2>
        <p className="mt-3 max-w-lg text-[0.95rem] leading-[1.75] text-muted">{contact.supporting}</p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {contactDetails.map((item) => {
            const Icon = iconMap[item.icon as IconName];
            const inner = (
              <>
                <span className="icon-chip">
                  <Icon />
                </span>
                <span className="min-w-0">
                  <span className="eyebrow block">{item.label}</span>
                  <span className="mt-1 block truncate text-[0.9rem] text-soft">{item.value}</span>
                </span>
              </>
            );
            return (
              <li key={item.label} className="tile spotlight shine shine--hover min-w-0 p-4">
                {"href" in item && item.href ? (
                  <a
                    href={item.href}
                    className="flex min-w-0 items-center gap-4 transition-colors duration-300 hover:text-accent"
                  >
                    {inner}
                  </a>
                ) : (
                  <span className="flex min-w-0 items-center gap-4">{inner}</span>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="mt-5" delay={70} labelledBy="elsewhere-heading">
        <SectionHeading className="mb-5">
          <span id="elsewhere-heading">Elsewhere</span>
        </SectionHeading>
        <ul className="flex flex-wrap gap-3">
          {socials.map((social) => {
            const Icon = iconMap[social.icon as IconName];
            return (
              <li key={social.label}>
                <a
                  href={social.href}
                  {...(social.href.startsWith("http") ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                  className="tile shine shine--hover inline-flex items-center gap-2 px-4 py-2.5 text-[0.85rem] text-soft transition-colors duration-300 hover:text-accent"
                >
                  <Icon width={16} height={16} />
                  {social.label}
                </a>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="mt-5" delay={140} labelledBy="message-heading">
        <SectionHeading>
          <span id="message-heading">Send a message</span>
        </SectionHeading>
        <ContactForm to={email} />
      </Card>
    </>
  );
}
