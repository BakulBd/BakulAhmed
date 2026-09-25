import Card from "@/components/card";
import { Award as AwardIcon, Calendar, Download } from "@/components/icons";
import { PageHeading, SectionHeading } from "@/components/page-heading";
import { breadcrumbNode, JsonLd, pageMetadata } from "@/lib/seo";
import { awards, education, experience, profile, skills, type TimelineEntry } from "@/lib/content";

export const metadata = pageMetadata({
  title: "Resume",
  description:
    "Resume of Bakul Ahmed — B.Sc. in Computer Science and Engineering at Green University of Bangladesh (CGPA 3.96), General Secretary of GUCC, with full-stack and AI/ML skills.",
  path: "/resume",
});

function Timeline({
  id,
  title,
  entries,
  delay = 0,
}: {
  id: string;
  title: string;
  entries: TimelineEntry[];
  delay?: number;
}) {
  return (
    <Card className="mt-5 first:mt-0" delay={delay} labelledBy={id}>
      <div className="flex items-center gap-3">
        <span className="icon-chip size-10">
          <Calendar width={18} height={18} />
        </span>
        <SectionHeading>
          <span id={id}>{title}</span>
        </SectionHeading>
      </div>

      <ol className="mt-7 max-w-3xl space-y-8 border-l border-line pl-6 md:pl-8">
        {entries.map((entry) => (
          <li key={`${entry.title}-${entry.period}`} className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-[1.7rem] top-2 size-2.5 rounded-full grad-accent ring-4 ring-[rgb(var(--panel-rgb))] md:-left-[2.2rem]"
            />
            <h3 className="text-[1.05rem] font-semibold text-fg">{entry.title}</h3>
            <p className="mt-1 text-[0.85rem] text-accent">{entry.period}</p>
            <p className="mt-1 text-[0.875rem] text-muted">
              {entry.org}
              {entry.location && <span className="text-muted/70"> · {entry.location}</span>}
            </p>
            <ul className="mt-3 space-y-2">
              {entry.points.map((point) => (
                <li
                  key={point}
                  className="grid grid-cols-[auto_1fr] gap-x-3 text-[0.875rem] leading-[1.75] text-muted"
                >
                  <span aria-hidden="true" className="pt-[0.55rem] text-accent">
                    <span className="block size-1 rounded-full bg-current" />
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </Card>
  );
}

export default function ResumePage() {
  return (
    <>
      <PageHeading lead="Education, experience and the tools I reach for. The full CV is a download away.">
        Resume
      </PageHeading>

      <a
        href={profile.cv}
        download
        className="btn-shine mb-7 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-[0.88rem] font-semibold text-accent-contrast transition-transform duration-300 hover:-translate-y-0.5"
      >
        <Download width={16} height={16} />
        Download CV
      </a>

      <Timeline id="education-heading" title="Education" entries={education} />
      <Timeline id="experience-heading" title="Experience & Leadership" entries={experience} delay={70} />

      <Card className="mt-5" delay={140} labelledBy="skills-heading">
        <SectionHeading className="mb-6">
          <span id="skills-heading">Technical Skills</span>
        </SectionHeading>
        <ul className="grid gap-4 sm:grid-cols-2">
          {skills.map((group) => (
            <li key={group.group} className="tile spotlight shine shine--hover p-5">
              <h3 className="eyebrow">{group.group}</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-line bg-panel px-3 py-1.5 text-[0.8rem] text-soft"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mt-5" delay={210} labelledBy="awards-heading">
        <div className="flex items-center gap-3">
          <span className="icon-chip size-10">
            <AwardIcon width={18} height={18} />
          </span>
          <SectionHeading>
            <span id="awards-heading">Certifications &amp; Awards</span>
          </SectionHeading>
        </div>
        <ul className="mt-7 grid gap-4 sm:grid-cols-2">
          {awards.map((award) => (
            <li key={award.title} className="tile spotlight shine shine--hover p-5">
              <p className="eyebrow">{award.year}</p>
              <h3 className="mt-2 text-[1rem] font-semibold text-fg">{award.title}</h3>
              <p className="mt-1 text-[0.85rem] text-accent">{award.org}</p>
              <p className="mt-2 text-[0.85rem] leading-[1.7] text-muted">{award.detail}</p>
            </li>
          ))}
        </ul>
      </Card>
      <JsonLd graph={[breadcrumbNode([{ name: "Resume", path: "/resume" }])]} />
    </>
  );
}
