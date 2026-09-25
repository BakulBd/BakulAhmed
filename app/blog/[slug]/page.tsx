import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, GitHub, LinkedIn } from "@/components/icons";
import PostCard from "@/components/post-card";
import { formatDate, getAdjacent, getPost, getPosts, getRelated } from "@/lib/blog";
import { blog, profile, site, socials } from "@/lib/content";
import { abs, breadcrumbNode, JsonLd, PERSON_ID, pageMetadata, WEBSITE_ID } from "@/lib/seo";

// Every post is known at build time; anything else is a 404, not a render.
export const dynamicParams = false;

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPosts().find((p) => p.slug === slug);
  if (!post) return {};
  return pageMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    type: "article",
    keywords: post.tags,
    article: { publishedTime: post.date, modifiedTime: post.updated, tags: post.tags, section: post.category },
  });
}

function XIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" {...p}>
      <path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z" />
    </svg>
  );
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const url = abs(`/blog/${post.slug}`);
  const { newer, older } = getAdjacent(post.slug);
  const related = getRelated(post.slug);
  const github = socials.find((s) => s.icon === "github")?.href;
  const linkedin = socials.find((s) => s.icon === "linkedin")?.href;
  const share = [
    { label: "Share on X", href: `https://x.com/intent/post?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(url)}`, Icon: XIcon },
    { label: "Share on LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, Icon: LinkedIn },
  ];

  return (
    <article>
      {/* Reading progress, driven by the scroll position in CSS — no script. */}
      <div className="read-progress" aria-hidden="true" />

      <nav aria-label="Breadcrumb" className="mb-6 text-[0.8rem] text-muted" data-reveal>
        <ol className="flex min-w-0 items-center gap-2">
          <li>
            <Link href="/" className="inline-block py-1 transition-colors hover:text-accent">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/blog" className="inline-block py-1 transition-colors hover:text-accent">
              {blog.title}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="min-w-0 truncate text-soft" aria-current="page">
            {post.title}
          </li>
        </ol>
      </nav>

      <header className="mb-8" data-reveal>
        <p className="eyebrow flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className="text-accent">{post.category}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={post.date}>{formatDate(post.date, "long")}</time>
          <span aria-hidden="true">·</span>
          <span>{post.readingMinutes} min read</span>
        </p>
        <h1 className="gradient-text mt-4 text-[clamp(1.8rem,4.6vw,2.9rem)] font-bold leading-[1.08] tracking-[-0.035em]">
          {post.title}
        </h1>
        <p className="mt-5 max-w-2xl text-[1rem] leading-[1.75] text-muted md:text-[1.06rem]">{post.description}</p>

        <div className="mt-6 flex items-center gap-3.5">
          <Image
            src={profile.image.src}
            alt=""
            width={44}
            height={44}
            className="size-11 rounded-full object-cover ring-2 ring-accent/60"
          />
          <div className="text-[0.85rem] leading-snug">
            <p className="font-semibold text-fg">
              <Link href="/" rel="author" className="inline-flex min-h-6 items-center transition-colors hover:text-accent">
                {site.name}
              </Link>
            </p>
            <p className="text-muted">
              {post.updated ? (
                <>
                  Updated <time dateTime={post.updated}>{formatDate(post.updated)}</time>
                </>
              ) : (
                profile.roleChip
              )}
            </p>
          </div>
        </div>
      </header>

      <figure className="post-cover mb-6 overflow-hidden rounded-[1.1rem] border border-line" data-reveal>
        <div className="relative aspect-[16/9]">
          <Image
            src={post.cover}
            alt={post.coverAlt}
            fill
            preload
            fetchPriority="high"
            unoptimized={post.cover.endsWith(".svg")}
            sizes="(min-width: 1120px) 760px, 92vw"
            className="object-cover"
          />
        </div>
      </figure>

      {/* Not <Card>: on a phone its padding stacked inside the panel's left a
          ~250px column of text. The article gets a slimmer inset there. */}
      <section className="panel shine shine--panel -mx-2 px-4 py-6 sm:mx-0 sm:p-7 md:p-9">
        {post.toc.length > 2 && (
          <details className="toc tile mb-9 p-4 sm:p-5" open>
            <summary className="flex min-h-[1.75rem] cursor-pointer items-center justify-between text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-soft">
              On this page
            </summary>
            <ol className="mt-3 space-y-1 text-[0.88rem]">
              {post.toc.map((h) => (
                <li key={h.id} className={h.depth === 3 ? "pl-4" : ""}>
                  <a href={`#${h.id}`} className="inline-block py-1 text-muted transition-colors hover:text-accent">
                    {h.text}
                  </a>
                </li>
              ))}
            </ol>
          </details>
        )}

        <div className="prose" dangerouslySetInnerHTML={{ __html: post.html }} />

        {post.tags.length > 0 && (
          <ul aria-label="Tags" className="mt-10 flex flex-wrap gap-2 border-t border-line pt-6">
            {post.tags.map((tag) => (
              <li key={tag} className="rounded-full border border-line bg-panel px-3 py-1 text-[0.75rem] text-muted">
                #{tag}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[0.8rem] text-muted">Share</span>
          {share.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="tile inline-flex size-10 items-center justify-center text-muted transition-colors hover:text-accent"
            >
              <Icon width={16} height={16} />
              <span className="sr-only">{label}</span>
            </a>
          ))}
          <button
            type="button"
            data-copy={url}
            data-label="Copy link"
            className="tile inline-flex h-10 items-center px-4 text-[0.8rem] text-muted transition-colors hover:text-accent"
          >
            Copy link
          </button>
        </div>
      </section>

      {/* Author */}
      <aside aria-label="About the author" className="mt-5" data-reveal>
        <div className="tile spotlight flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <Image
            src={profile.image.src}
            alt={site.name}
            width={84}
            height={84}
            className="size-[84px] shrink-0 rounded-2xl object-cover"
          />
          <div className="min-w-0">
            <p className="eyebrow">Written by</p>
            <p className="mt-1.5 text-[1.1rem] font-semibold text-fg">{site.name}</p>
            <p className="mt-1.5 text-[0.85rem] leading-[1.7] text-muted">{profile.intro}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.82rem]">
              <Link href="/" className="inline-flex min-h-[2rem] items-center gap-1 text-accent hover:opacity-80">
                About me <ArrowUpRight width={13} height={13} />
              </Link>
              {github && (
                <a href={github} target="_blank" rel="noopener noreferrer me" className="inline-flex min-h-[2rem] items-center gap-1.5 text-muted hover:text-accent">
                  <GitHub width={14} height={14} /> GitHub
                </a>
              )}
              {linkedin && (
                <a href={linkedin} target="_blank" rel="noopener noreferrer me" className="inline-flex min-h-[2rem] items-center gap-1.5 text-muted hover:text-accent">
                  <LinkedIn width={14} height={14} /> LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>
      </aside>

      {(newer || older) && (
        <nav aria-label="More posts" className="mt-5 grid gap-4 sm:grid-cols-2" data-reveal>
          {[
            { post: older, label: "Previous" },
            { post: newer, label: "Next" },
          ].map(({ post: p, label }) =>
            p ? (
              <Link
                key={label}
                href={`/blog/${p.slug}`}
                className={`tile group flex flex-col p-5 ${label === "Next" ? "sm:col-start-2 sm:text-right" : ""}`}
              >
                <span className="eyebrow">{label === "Next" ? "Next →" : "← Previous"}</span>
                <span className="mt-2 text-[0.95rem] font-semibold leading-snug text-fg transition-colors group-hover:text-accent">
                  {p.title}
                </span>
              </Link>
            ) : null,
          )}
        </nav>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-14">
          <h2 id="related-heading" className="mb-5 text-[1.3rem] font-semibold tracking-[-0.02em] text-fg">
            Keep reading
          </h2>
          <ul className="grid gap-5 sm:grid-cols-2">
            {related.map((p, i) => (
              <li key={p.slug}>
                <PostCard post={p} delay={i * 60} headingLevel={3} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <JsonLd
        graph={[
          {
            "@type": "BlogPosting",
            "@id": `${url}#article`,
            url,
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
            headline: post.title,
            description: post.description,
            image: [abs(`/blog/${post.slug}/opengraph-image`)],
            datePublished: post.date,
            dateModified: post.updated ?? post.date,
            author: { "@type": "Person", "@id": PERSON_ID, name: site.name, url: abs("/") },
            publisher: { "@id": PERSON_ID },
            isPartOf: [{ "@id": WEBSITE_ID }, { "@id": `${abs("/blog")}#blog` }],
            articleSection: post.category,
            keywords: post.tags.join(", "),
            wordCount: post.words,
            timeRequired: `PT${post.readingMinutes}M`,
            inLanguage: "en",
          },
          breadcrumbNode([
            { name: blog.title, path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />
    </article>
  );
}
