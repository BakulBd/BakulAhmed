import Card from "@/components/card";
import { ArrowUpRight, Award as AwardIcon, Calendar, Download } from "@/components/icons";
import { PageHeading, SectionHeading } from "@/components/page-heading";
import { breadcrumbNode, JsonLd, pageMetadata, PERSON_ID, webPageNode } from "@/lib/seo";
import { awards, education, experience, profile, skills, type TimelineEntry } from "@/lib/content";

export const metadata = pageMetadata({
  // Search results show the title, so it carries what the page is about.
  title: "Resume & CV: Full-Stack and AI Engineer",
  description:
    "Resume of Bakul Ahmed: B.Sc. in CSE at Green University of Bangladesh (CGPA 3.96/4.00), General Secretary of GUCC, with full-stack and AI/ML skills.",
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

      <ol className="timeline mt-7 max-w-3xl">
        {entries.map((entry) => {
          const current = /present/i.test(entry.period);
          return (
            <li key={`${entry.title}-${entry.period}`} className="timeline__item" data-current={current || undefined}>
              <span aria-hidden="true" className="timeline__dot" />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="timeline__period">{entry.period}</p>
                {current && (
                  <span className="timeline__now">
                    <span aria-hidden="true" className="timeline__pulse" />
                    Now
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-[1.08rem] font-semibold leading-snug tracking-[-0.01em] text-fg">{entry.title}</h3>
              <p className="mt-1 text-[0.875rem] text-soft">
                {entry.org}
                {entry.location && <span className="text-muted"> · {entry.location}</span>}
              </p>
              <ul className="mt-3.5 space-y-2">
                {entry.points.map((point) => (
                  <li
                    key={point}
                    className="grid grid-cols-[auto_1fr] gap-x-3 text-[0.875rem] leading-[1.75] text-muted"
                  >
                    <span aria-hidden="true" className="pt-[0.6rem] text-accent">
                      <span className="block h-px w-2.5 bg-current" />
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
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

      <div className="btn-row mb-7">
        <a href={profile.cv} download className="btn btn--primary btn-shine">
          <Download width={16} height={16} className="btn__icon--down" />
          Download CV
        </a>
        <a href={profile.cv} target="_blank" rel="noopener" className="btn btn--ghost">
          View PDF
          <ArrowUpRight width={15} height={15} className="btn__icon--out" />
        </a>
      </div>

      <Timeline id="education-heading" title="Education" entries={education} />
      <Timeline id="experience-heading" title="Experience & Leadership" entries={experience} delay={70} />

      <Card className="mt-5" delay={140} labelledBy="skills-heading">
        <SectionHeading className="mb-6">
          <span id="skills-heading">Technical Skills</span>
        </SectionHeading>
        <ul className="grid gap-4 sm:grid-cols-2">
          {skills.map((group) => (
            <li key={group.group} className="tile spotlight shine shine--hover p-5">
              <h3 className="eyebrow flex items-center justify-between gap-3">
                {group.group}
                <span aria-hidden="true" className="font-mono text-[0.68rem] tracking-[0.06em] text-muted">
                  {String(group.items.length).padStart(2, "0")}
                </span>
              </h3>
              <ul className="mt-3.5 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li key={item} className="skill">
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
        {/* An odd last award takes the full row, so the grid closes square. */}
        <ul className="mt-7 grid gap-4 sm:grid-cols-2 sm:[&>li:last-child:nth-child(odd)]:col-span-2">
          {awards.map((award) => (
            <li key={award.title} className="tile spotlight shine shine--hover p-5">
              <p className="eyebrow font-mono tracking-[0.08em]">{award.year}</p>
              <h3 className="mt-2 text-[1rem] font-semibold text-fg">{award.title}</h3>
              <p className="mt-1 text-[0.85rem] text-accent">{award.org}</p>
              <p className="mt-2 text-[0.85rem] leading-[1.7] text-muted">{award.detail}</p>
            </li>
          ))}
        </ul>
      </Card>
      <JsonLd
        graph={[
          webPageNode({
            path: "/resume",
            name: `Resume — ${profile.name}`,
            description: "Education, experience, technical skills, certifications and awards.",
            type: "AboutPage",
            mainEntity: { "@id": PERSON_ID },
          }),
          breadcrumbNode([{ name: "Resume", path: "/resume" }]),
        ]}
      />
    </>
  );
}
