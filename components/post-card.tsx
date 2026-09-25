import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "./icons";
import { formatDate, type PostMeta } from "@/lib/blog-shared";

/**
 * A post as a card. The whole card is one link, so the title, image and
 * arrow are a single tab stop and a single tap target.
 *
 * `feature` lays it out wide — image beside the text — for the pinned post at
 * the top of the blog.
 */
export default function PostCard({
  post,
  feature = false,
  delay = 0,
  headingLevel = 2,
  priority = false,
}: {
  post: PostMeta;
  feature?: boolean;
  delay?: number;
  headingLevel?: 2 | 3;
  priority?: boolean;
}) {
  const Heading = `h${headingLevel}` as const;
  return (
    <article
      className="tile spotlight shine shine--hover group h-full overflow-hidden"
      data-reveal
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      <Link href={`/blog/${post.slug}`} className={`flex h-full flex-col ${feature ? "md:flex-row" : ""}`}>
        <div
          className={`relative aspect-[16/10] shrink-0 overflow-hidden border-b border-line-soft bg-panel ${
            feature ? "md:aspect-auto md:w-[52%] md:border-b-0 md:border-r" : ""
          }`}
        >
          <Image
            src={post.cover}
            alt={post.coverAlt}
            fill
            // `priority` is deprecated in Next 16 and no longer emits a fetch hint.
            preload={priority}
            fetchPriority={priority ? "high" : undefined}
            // SVG art gains nothing from the optimiser; skip the extra hop.
            unoptimized={post.cover.endsWith(".svg")}
            sizes={feature ? "(min-width: 768px) 40vw, 92vw" : "(min-width: 640px) 40vw, 92vw"}
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(.22,.68,.28,1)] group-hover:scale-105"
          />
          <span className="post-chip absolute left-3 top-3">{post.category}</span>
        </div>

        <div className={`flex flex-1 flex-col p-5 ${feature ? "md:justify-center md:p-8" : ""}`}>
          <p className="eyebrow flex flex-wrap items-center gap-x-2 gap-y-1">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden="true">·</span>
            <span>{post.readingMinutes} min read</span>
          </p>
          <Heading
            className={`mt-2.5 font-semibold leading-snug tracking-[-0.015em] text-fg transition-colors duration-300 group-hover:text-accent ${
              feature ? "text-[1.25rem] md:text-[1.55rem]" : "text-[1.05rem]"
            }`}
          >
            {post.title}
          </Heading>
          <p className={`mt-2.5 leading-[1.7] text-muted ${feature ? "text-[0.9rem]" : "text-[0.85rem]"}`}>
            {post.description}
          </p>
          <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[0.82rem] font-medium text-soft transition-colors duration-300 group-hover:text-accent">
            Read article
            <ArrowUpRight
              width={14}
              height={14}
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </Link>
    </article>
  );
}
