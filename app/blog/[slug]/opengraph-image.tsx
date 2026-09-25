import { formatDate, getPosts } from "@/lib/blog";
import { site } from "@/lib/content";
import { renderOg, OG_SIZE } from "@/lib/og";

export const alt = `Article by ${site.name}`;
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamicParams = false;

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPosts().find((p) => p.slug === slug)!;
  return renderOg({
    variant: "article",
    label: post.category,
    title: post.title,
    meta: `${formatDate(post.date, "long")} · ${post.readingMinutes} min read`,
  });
}
