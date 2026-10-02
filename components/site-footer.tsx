import Link from "next/link";
import BackToTop from "./back-to-top";
import { ArrowUpRight, iconMap, type IconName } from "./icons";
import SkyAlmanac from "./sky-almanac";
import { nav, profile, site, socials, versions } from "@/lib/content";

/**
 * The footer, in three tiers: who this is and where to go next; what the sky
 * is doing (the almanac and its season picker); and the small print, with the
 * way back to the top of the page.
 */
export default function SiteFooter() {
  // The wordmark, as the header sets it: the family name in the accent.
  const [first, ...others] = site.name.split(" ");
  const rest = others.join(" ");
  return (
    // On glass, like everything else that carries text: below the panels the
    // footer sits on open sky, and muted text on a noon sky measured ~2:1.
    <footer className="mt-16 md:mt-24">
      <div className="panel px-6 py-7 md:px-9 md:py-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
          <div className="max-w-[27rem]">
            <p className="text-[1.05rem] font-semibold tracking-[-0.02em] text-fg">
              {first} <span className="text-accent">{rest}.</span>
            </p>
            <p className="mt-1.5 text-[0.85rem] leading-relaxed text-muted">{site.tagline}</p>
          </div>

          {/* Every page, from the end of every page — where a long read
              finishes and the tab bar may have tucked itself away. */}
          <nav aria-label="Footer">
            <ul className="-mx-2 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[0.84rem] sm:justify-end">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-[2rem] items-center rounded-lg px-2 text-soft transition-colors duration-300 hover:bg-panel-hover hover:text-accent"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                {/* A plain anchor: the feed is XML, not a page to client-navigate to. */}
                <a
                  href="/feed.xml"
                  className="inline-flex min-h-[2rem] items-center rounded-lg px-2 text-muted transition-colors duration-300 hover:bg-panel-hover hover:text-accent"
                >
                  RSS
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <hr className="my-6 border-line-soft" />

        {/* The live sky and the profiles are for the screen; on paper the
            footer is the name, the line and the address. */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between print:hidden">
          <SkyAlmanac />

          <ul className="-mx-2 flex items-center gap-1">
            {socials.map((social) => {
              const Icon = iconMap[social.icon as IconName];
              return (
                <li key={social.label}>
                  <a
                    href={social.href}
                    {...(social.href.startsWith("http") ? { target: "_blank", rel: "me noreferrer noopener" } : {})}
                    className="inline-flex size-10 items-center justify-center rounded-xl text-muted transition-colors duration-300 hover:bg-panel-soft hover:text-accent"
                  >
                    <Icon width={18} height={18} />
                    <span className="sr-only">{social.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <hr className="my-6 border-line-soft" />

        <div className="flex flex-col gap-3 text-[0.78rem] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name} · {profile.location}
            <span className="hidden print:inline"> · {new URL(site.url).host}</span>
          </p>
          <div className="-mx-2 flex flex-wrap items-center gap-x-1 gap-y-1 print:hidden">
            <span className="px-2">Other versions:</span>
            {versions.map((v) => (
              <a
                key={v.name}
                href={v.href}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex min-h-[2rem] items-center gap-1 rounded-lg px-2 text-accent transition-colors duration-300 hover:bg-panel-hover"
              >
                {v.name}
                <ArrowUpRight width={12} height={12} />
              </a>
            ))}
            <span aria-hidden="true" className="px-1 text-muted/50 max-sm:hidden">
              ·
            </span>
            <BackToTop />
          </div>
        </div>
      </div>
    </footer>
  );
}
