import Image from "next/image";
import { ArrowUpRight, FileText, Gallery, Laurel, Verified } from "./icons";
import { SectionHeading } from "./page-heading";
import { formatDate } from "@/lib/blog-shared";
import { recognitions, type Recognition } from "@/lib/content";

const path = (url: string) => {
  const u = new URL(url);
  return `${u.host.replace(/^www\./, "")}${u.pathname}`;
};

/**
 * One recognition. The whole card opens the issuer's own page — the title is
 * the link, stretched over the card — because the point of the card is that
 * you can check it. A local copy of the document, where there is one, is a
 * second link raised above the stretch.
 */
function RecognitionCard({ item, index }: { item: Recognition; index: number }) {
  const titleId = `${item.id}-title`;
  const award = item.kind === "award";
  return (
    <li data-reveal style={{ "--reveal-delay": `${index * 80}ms` } as React.CSSProperties}>
      <article
        aria-labelledby={titleId}
        className="recog tile spotlight shine shine--hover lazy-card group"
        data-kind={item.kind}
      >
        <div className="recog__media" aria-hidden="true">
          {award ? (
            <div className="recog__sheet">
              <Image
                src={item.image.src}
                alt=""
                width={item.image.width}
                height={item.image.height}
                sizes="(min-width: 1120px) 160px, (min-width: 640px) 150px, 40vw"
                className="recog__img"
              />
              <span className="recog__foil" />
            </div>
          ) : (
            <div className="recog__browser">
              <span className="recog__bar">
                <span className="recog__dots">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="recog__url">{path(item.verifyUrl)}</span>
              </span>
              <Image
                src={item.image.src}
                alt=""
                width={item.image.width}
                height={item.image.height}
                sizes="(min-width: 1120px) 340px, (min-width: 640px) 40vw, 80vw"
                className="recog__img"
              />
            </div>
          )}
          <span className="recog__seal">{award ? <Laurel width={20} height={20} /> : <Gallery width={18} height={18} />}</span>
        </div>

        <div className="recog__body">
          <p className="eyebrow">
            {award ? "Award" : "Gallery listing"} · <time dateTime={item.date}>{formatDate(item.date)}</time>
          </p>
          <h3 id={titleId} className="mt-2 text-[1.15rem] font-semibold tracking-[-0.01em] text-fg">
            <a href={item.verifyUrl} target="_blank" rel="noopener" className="recog__link">
              {item.title}
              <span className="sr-only">
                {" "}
                — {item.verifyLabel} (opens in a new tab)
              </span>
            </a>
          </h3>
          <p className="mt-1 text-[0.85rem] text-accent">{item.issuer}</p>
          <p className="mt-2 text-[0.85rem] leading-[1.7] text-muted">{item.summary}</p>

          <dl className="recog__facts">
            {item.facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd className={fact.mono ? "font-mono tracking-[0.04em]" : undefined}>{fact.value}</dd>
              </div>
            ))}
          </dl>

          <div className="recog__actions">
            {/* What the stretched title does, said where the eye expects a
                button. Not a second link to the same place: one per card. */}
            <span aria-hidden="true" className="btn btn--primary btn--sm recog__cta">
              <Verified width={14} height={14} />
              {award ? "Verify" : "View listing"}
              <ArrowUpRight width={13} height={13} className="btn__icon--out" />
            </span>
            {item.document && (
              <a href={item.document.href} target="_blank" rel="noopener" className="btn btn--ghost btn--sm recog__raise">
                <FileText width={14} height={14} />
                PDF
                <span className="sr-only"> — {item.title} certificate, opens in a new tab</span>
              </a>
            )}
          </div>
        </div>
      </article>
    </li>
  );
}

/** The home page's Awards & Recognition section, inside the content panel. */
export default function RecognitionSection() {
  return (
    <section id="recognition" aria-labelledby="recognition-heading" className="lazy-section mt-6 md:mt-12">
      <SectionHeading rule className="mb-2">
        <span id="recognition-heading">Awards &amp; recognition</span>
      </SectionHeading>
      <p className="mb-6 max-w-2xl text-[0.9rem] text-muted">For this site’s design. Each card opens the issuer’s page to verify it.</p>
      <ul className="grid gap-4 sm:grid-cols-2 md:gap-5">
        {recognitions.map((item, i) => (
          <RecognitionCard key={item.id} item={item} index={i} />
        ))}
      </ul>
    </section>
  );
}

/**
 * The same two as achievements beside the hero's buttons: gold medallions on
 * small badges, each pointing down to its evidence. Gold because these are
 * honours, whatever the hour's palette; the listing keeps its honest label.
 */
export function RecognitionStrip() {
  return (
    <ul className="achievements" aria-label="Recognition">
      {recognitions.map((item) => (
        <li key={item.id}>
          <a href="#recognition" className="achievement">
            <span className="achievement__medal" aria-hidden="true">
              {item.kind === "award" ? <Laurel width={16} height={16} /> : <Gallery width={15} height={15} />}
            </span>
            <span className="achievement__text">
              <span className="achievement__title">{item.title}</span>
              <span className="achievement__meta">
                {item.kind === "award" ? item.issuer : "Gallery listing"} · <time dateTime={item.date}>{formatDate(item.date)}</time>
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
