import { formatDate, getPosts } from "@/lib/blog";
import { renderOg } from "@/lib/og";

/**
 * A post's share card, as a plain prerendered route rather than the
 * opengraph-image file convention. The convention can only give every post's
 * card the same static alt text; giving each its own (generateImageMetadata)
 * moved the card under an id segment that Next 16 never prerenders, and with
 * dynamicParams off every card 404'd in production while working in dev. Here
 * the post's metadata names the card and its alt explicitly (lib/seo.tsx).
 */
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPosts().find((p) => p.slug === slug);
  if (!post) return new Response("Not found", { status: 404 });
  return renderOg({
    variant: "article",
    label: post.category,
    title: post.title,
    meta: `${formatDate(post.date, "long")} · ${post.readingMinutes} min read`,
    cover: post.cover,
  });
}
