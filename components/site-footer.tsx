import { ArrowUpRight, iconMap, type IconName } from "./icons";
import { site, socials, versions } from "@/lib/content";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line md:mt-24">
      <div className="shell flex flex-col gap-6 py-9 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-soft">
            © {new Date().getFullYear()} {site.name}
          </p>
          {/* The season is set on <html> before first paint; CSS names it, so
              this needs no script and can never disagree with the sky. */}
          <p className="mt-1.5 text-[0.8rem] text-muted">
            The sky follows your local time<span className="season-name" />
          </p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8rem] text-muted">
            <span>Other versions:</span>
            {versions.map((v) => (
              <a
                key={v.name}
                href={v.href}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex min-h-[1.75rem] items-center gap-1 text-accent transition-opacity duration-300 hover:opacity-75"
              >
                {v.name}
                <ArrowUpRight width={12} height={12} />
              </a>
            ))}
          </p>
        </div>

        <ul className="flex items-center gap-1">
          {socials.map((social) => {
            const Icon = iconMap[social.icon as IconName];
            return (
              <li key={social.label}>
                <a
                  href={social.href}
                  {...(social.href.startsWith("http") ? { target: "_blank", rel: "noreferrer noopener" } : {})}
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
    </footer>
  );
}
