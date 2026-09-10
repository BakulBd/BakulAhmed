import type { Metadata } from "next";
import Image from "next/image";
import Card from "@/components/card";
import { PageHeading } from "@/components/page-heading";
import { posts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes on software engineering, machine learning and building useful products.",
  alternates: { canonical: "/blog" },
};

const formatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default function BlogPage() {
  return (
    <>
      <PageHeading lead="Notes on the things I build — multiplayer sync, model evaluation, and shipping software people actually use.">Blog</PageHeading>

      <Card>
      <ul className="grid gap-5 sm:grid-cols-2">
        {posts.map((post, i) => {
          const content = (
            <>
              <div className="relative aspect-[16/10] overflow-hidden border-b border-line-soft bg-panel">
                <Image
                  src={post.image}
                  alt={post.imageAlt}
                  fill
                  sizes="(min-width: 640px) 45vw, 90vw"
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(.22,.68,.28,1)] group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <p className="eyebrow">
                  {post.category} ·{" "}
                  <time dateTime={post.date}>{formatter.format(new Date(post.date))}</time>
                </p>
                <h2 className="mt-2 text-[1.05rem] font-semibold leading-snug text-fg transition-colors duration-300 group-hover:text-accent">
                  {post.title}
                </h2>
                <p className="mt-2 text-[0.85rem] leading-[1.7] text-muted">{post.excerpt}</p>
              </div>
            </>
          );

          return (
            <li
              key={post.slug}
              className="tile spotlight shine shine--hover group overflow-hidden transition-colors duration-300"
              data-reveal
              style={{ "--reveal-delay": `${i * 70}ms` } as React.CSSProperties}
            >
              {post.href ? (
                <a href={post.href} className="block">
                  {content}
                </a>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-8 text-[0.85rem] text-muted">
        These are sample entries. Point each post’s <code className="font-mono text-accent">href</code> at a real
        article in <code className="font-mono text-accent">lib/content.ts</code>, or remove Blog from the navigation.
      </p>
      </Card>
    </>
  );
}
