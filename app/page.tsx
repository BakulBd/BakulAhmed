import Link from "next/link";
import Counter from "@/components/counter";
import LocalTime from "@/components/local-time";
import { ArrowUpRight, Download, iconMap, type IconName } from "@/components/icons";
import RichText from "@/components/rich-text";
import MoodLine from "@/components/mood-line";
import RoleRotator from "@/components/role-rotator";
import { SectionHeading } from "@/components/page-heading";
import PostCard from "@/components/post-card";
import ProjectArt from "@/components/project-art";
import { getPosts } from "@/lib/blog";
import { JsonLd, personNode, pageMetadata, WEBSITE_ID } from "@/lib/seo";
import {
  about,
  contactDetails,
  profile,
  projects,
  site,
  services,
  skills,
  stats,
  versions,
} from "@/lib/content";

export const metadata = pageMetadata({
  title: `${site.name} — ${site.title}`,
  absoluteTitle: true,
  description: site.description,
  path: "/",
  type: "profile",
});

const email = contactDetails.find((c) => c.label === "Email")?.href ?? "#";
const marquee = skills.flatMap((g) => g.items);
const featured = projects[0];

export default function HomePage() {
  const latest = getPosts().slice(0, 2);
  return (
    <>
      {/* ---- Hero. Identity lives in the rail, so this leads with the work. ---- */}
      <section aria-labelledby="intro-heading" className="mb-8" data-reveal>
        <p className="eyebrow flex flex-wrap items-center gap-x-2.5 gap-y-2 leading-normal">
          <span aria-hidden="true" className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-accent" />
          </span>
          {profile.status}
          {/* One line from 640px; below that the time takes its own line,
              aligned under the status text rather than stranding a slash. */}
          <span aria-hidden="true" className="text-muted/50 max-sm:hidden">
            /
          </span>
          <span className="max-sm:basis-full max-sm:pl-[1.125rem]">
            <LocalTime />
          </span>
        </p>

        <h1
          id="intro-heading"
          className="gradient-text mt-4 max-w-[22ch] text-[clamp(1.9rem,4.4vw,3rem)] font-bold leading-[1.06] tracking-[-0.035em]"
        >
          {profile.role}
        </h1>

        <p className="mt-3 text-[1rem] font-medium md:text-[1.15rem]">
          <RoleRotator roles={profile.roles} />
        </p>

        <p className="mt-4 text-[0.9rem] text-soft">
          <MoodLine />
        </p>

        <p className="mt-4 max-w-2xl text-[0.95rem] leading-[1.8] text-muted">{profile.intro}</p>

        {/* What he builds, researches and leads — each line points at its
            evidence, so the claim and the proof are one click apart. */}
        <ul className="focus mt-6 max-w-2xl" aria-label="Focus">
          {profile.focus.map((item) => (
            <li key={item.label}>
              <Link href={item.href} className="focus__row">
                <span className="focus__label">{item.label}</span>
                <span className="focus__text">{item.text}</span>
                <ArrowUpRight width={15} height={15} className="focus__arrow" />
              </Link>
            </li>
          ))}
        </ul>

        <div className="btn-row mt-7">
          <a href={profile.cv} download className="btn btn--primary btn-shine">
            <Download width={16} height={16} className="btn__icon--down" />
            Download CV
          </a>
          <Link href="/portfolio" className="btn btn--ghost">
            See the work
            <ArrowUpRight width={15} height={15} className="btn__icon--out" />
          </Link>
        </div>
      </section>

      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <li
            key={stat.label}
            className="tile shine shine--hover spotlight min-w-0 p-4 text-center"
            data-reveal
            style={{ "--reveal-delay": `${i * 70}ms` } as React.CSSProperties}
          >
            <p className="text-[clamp(1.15rem,3.4vw,1.75rem)] font-bold leading-tight text-accent">
              <Counter value={stat.value} decimals={stat.decimals ?? 0} suffix={stat.suffix} />
            </p>
            <p className="eyebrow mt-2">{stat.label}</p>
          </li>
        ))}
      </ul>

      {/* ---- Tech marquee ---- */}
      <div
        className="tile mt-4 overflow-hidden py-4"
        aria-hidden="true"
        data-reveal
      >
        <div className="marquee">
          {[0, 1].map((copy) => (
            <div key={copy} className="marquee__track">
              {marquee.map((item) => (
                <span key={`${copy}-${item}`} className="whitespace-nowrap text-[0.85rem] text-muted">
                  {item}
                  <span className="ml-8 text-accent/50">◆</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ---- About ---- */}
      <section aria-labelledby="about-heading" className="lazy-section mt-6 md:mt-12">
        <SectionHeading rule className="mb-6">
          <span id="about-heading">About me</span>
        </SectionHeading>
        <div className="max-w-3xl space-y-4 text-[0.95rem] leading-[1.8] text-muted" data-reveal>
          {about.paragraphs.map((p) => (
            <RichText key={p.slice(0, 32)} as="p" text={p} />
          ))}
        </div>
      </section>

      {/* ---- What I'm doing ---- */}
      <section aria-labelledby="doing-heading" className="lazy-section mt-6 md:mt-12">
        <SectionHeading rule className="mb-6">
          <span id="doing-heading">What I’m doing</span>
        </SectionHeading>
        <ul className="grid gap-4 sm:grid-cols-2 md:gap-5">
          {services.map((service, i) => {
            const Icon = iconMap[service.icon as IconName];
            return (
              <li
                key={service.title}
                className="tile shine shine--hover spotlight group p-5 sm:p-6"
                data-reveal
                style={{ "--reveal-delay": `${i * 70}ms` } as React.CSSProperties}
              >
                <span className="icon-chip icon-chip--live">
                  <Icon width={20} height={20} />
                </span>
                <h3 className="mt-4 text-[1.05rem] font-semibold text-fg">{service.title}</h3>
                <p className="mt-2 text-[0.875rem] leading-[1.75] text-muted">{service.text}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ---- Featured project ---- */}
      <section aria-labelledby="featured-heading" className="lazy-section mt-6 md:mt-12">
        <SectionHeading rule className="mb-6">
          <span id="featured-heading">Featured</span>
        </SectionHeading>
        <article className="tile shine shine--hover spotlight tilt lazy-card group overflow-hidden md:flex" data-reveal>
          <div className="relative aspect-[16/10] md:aspect-auto md:w-1/2">
            <ProjectArt
              src={featured.image}
              alt={featured.imageAlt}
              uid={`featured-${featured.slug}`}
              fit="contain"
              sizes="(min-width: 768px) 50vw, 92vw"
              className="duration-700 group-hover:scale-105"
            />
          </div>
          <div className="p-6 md:w-1/2 md:p-8">
            <p className="eyebrow">
              {featured.category} · {featured.year}
            </p>
            <h3 className="mt-2 text-[1.4rem] font-semibold text-fg">{featured.name}</h3>
            <p className="mt-1 text-[0.85rem] text-accent">{featured.subtitle}</p>
            <p className="mt-3 text-[0.9rem] leading-[1.75] text-muted">{featured.summary}</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1">
              {featured.post && (
                <Link
                  href={`/blog/${featured.post}`}
                  className="inline-flex min-h-[2rem] items-center gap-1.5 text-[0.85rem] font-medium text-accent transition-opacity duration-300 hover:opacity-80"
                >
                  Read how it works
                  <ArrowUpRight width={14} height={14} />
                </Link>
              )}
              <Link
                href="/portfolio"
                className="inline-flex min-h-[2rem] items-center gap-1.5 text-[0.85rem] text-soft transition-colors duration-300 hover:text-accent"
              >
                All projects
                <ArrowUpRight width={14} height={14} />
              </Link>
            </div>
          </div>
        </article>
      </section>

      {/* ---- Latest writing ---- */}
      {latest.length > 0 && (
        <section aria-labelledby="writing-heading" className="lazy-section mt-6 md:mt-12">
          <div className="mb-6 flex items-center justify-between gap-4">
            <SectionHeading rule className="flex-1">
              <span id="writing-heading">Latest writing</span>
            </SectionHeading>
            <Link
              href="/blog"
              className="inline-flex min-h-[2rem] shrink-0 items-center gap-1.5 text-[0.85rem] text-soft transition-colors duration-300 hover:text-accent"
            >
              All posts
              <ArrowUpRight width={14} height={14} />
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 md:gap-5">
            {latest.map((post, i) => (
              <li key={post.slug}>
                <PostCard post={post} delay={i * 70} headingLevel={3} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---- Other versions ---- */}
      <section aria-labelledby="versions-heading" className="lazy-section mt-6 md:mt-12">
        <SectionHeading rule className="mb-2">
          <span id="versions-heading">Other versions of this portfolio</span>
        </SectionHeading>
        <p className="mb-6 max-w-2xl text-[0.9rem] text-muted">
          Same person, three different ideas of what a portfolio should be. Take whichever you prefer.
        </p>
        <ul className="grid gap-4 sm:grid-cols-2 md:gap-5">
          {versions.map((version, i) => (
            <li key={version.name} data-reveal style={{ "--reveal-delay": `${i * 80}ms` } as React.CSSProperties}>
              <a
                href={version.href}
                target="_blank"
                rel="noreferrer noopener"
                className="tile shine shine--hover spotlight group flex h-full flex-col p-6"
              >
                <span className="flex items-center justify-between gap-4">
                  <span className="text-[1.25rem] font-semibold text-fg">{version.name}</span>
                  <ArrowUpRight
                    width={18}
                    height={18}
                    className="text-muted transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                  />
                </span>
                <span className="eyebrow mt-1.5 block text-accent">{version.tag}</span>
                <span className="mt-3 block text-[0.875rem] leading-[1.75] text-muted">{version.blurb}</span>
                <span className="mt-4 block font-mono text-[0.76rem] text-muted">
                  {version.href.replace("https://", "")}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* ---- Contact strip ---- */}
      <section className="lazy-section mt-6 md:mt-12" data-reveal>
        <div className="tile tile--glow shine shine--panel spotlight flex flex-col items-start gap-5 p-7 sm:flex-row sm:items-center sm:justify-between md:p-9">
          <div>
            <h2 className="text-[1.5rem] font-bold tracking-[-0.03em] text-fg md:text-[1.9rem]">
              Let’s build something useful.
            </h2>
            <p className="mt-2 text-[0.9rem] text-muted">
              Open to internships, research and collaboration.
            </p>
          </div>
          <a href={email} className="btn btn--primary btn-shine shrink-0">
            Get in touch
            <ArrowUpRight width={15} height={15} className="btn__icon--out" />
          </a>
        </div>
      </section>

      {/* Tells search engines this page is one person's profile — the page
          Google can show with the portrait for a search on the name. */}
      <JsonLd
        graph={[
          {
            "@type": "ProfilePage",
            "@id": `${site.url.replace(/\/$/, "")}/#profile`,
            url: site.url,
            name: `${site.name} — ${site.title}`,
            inLanguage: "en",
            isPartOf: { "@id": WEBSITE_ID },
            // The copy's own date, not the build's: a date that moves on every
            // deploy teaches crawlers to ignore it.
            dateModified: site.updated,
            mainEntity: personNode,
            primaryImageOfPage: personNode.image,
          },
        ]}
      />
    </>
  );
}
