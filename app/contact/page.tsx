import Card from "@/components/card";
import ContactForm from "@/components/contact-form";
import { Check, Copy, iconMap, type IconName } from "@/components/icons";
import LocalTime from "@/components/local-time";
import { PageHeading, SectionHeading } from "@/components/page-heading";
import { contact, contactDetails, socials } from "@/lib/content";
import { breadcrumbNode, JsonLd, PERSON_ID, pageMetadata, webPageNode } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact: Internships and Collaboration",
  description: "Get in touch with Bakul Ahmed about internships, research, projects and collaboration.",
  path: "/contact",
});

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
        <p className="mt-4 inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border border-line bg-panel-soft px-3.5 py-2 text-[0.82rem] text-soft max-[340px]:whitespace-normal max-[340px]:rounded-2xl max-[340px]:text-[0.76rem]">
          <span aria-hidden="true" className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-accent" />
          </span>
          <LocalTime variant="sentence" />
        </p>

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
                  <span className="mt-1 block text-[0.9rem] leading-snug text-soft [overflow-wrap:anywhere]">{item.value}</span>
                </span>
              </>
            );
            return (
              <li key={item.label} className="tile spotlight shine shine--hover flex min-w-0 items-center gap-2 p-4">
                {"href" in item && item.href ? (
                  <a
                    href={item.href}
                    className="flex min-w-0 flex-1 items-center gap-4 transition-colors duration-300 hover:text-accent"
                  >
                    {inner}
                  </a>
                ) : (
                  <span className="flex min-w-0 flex-1 items-center gap-4">{inner}</span>
                )}
                {/* The address, one press away from the clipboard — for anyone
                    whose mail client is not the one mailto: opens. */}
                {item.label === "Email" && (
                  <button
                    type="button"
                    data-copy={item.value}
                    data-icon=""
                    title="Copy email address"
                    className="copy-chip"
                  >
                    <Copy width={15} height={15} className="copy-chip__copy" />
                    <Check width={15} height={15} className="copy-chip__done" />
                    <span className="sr-only" aria-live="polite" data-copy-label>
                      Copy email address
                    </span>
                  </button>
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
                  {...(social.href.startsWith("http") ? { target: "_blank", rel: "me noreferrer noopener" } : {})}
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
      <JsonLd
        graph={[
          webPageNode({
            path: "/contact",
            name: "Contact Bakul Ahmed",
            description: "Email, phone and profiles for internships, research and collaboration.",
            type: "ContactPage",
            mainEntity: { "@id": PERSON_ID },
          }),
          breadcrumbNode([{ name: "Contact", path: "/contact" }]),
        ]}
      />
    </>
  );
}
