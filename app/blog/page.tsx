import BlogBrowser from "@/components/blog-browser";
import Card from "@/components/card";
import { PageHeading } from "@/components/page-heading";
import PostCard from "@/components/post-card";
import { getPosts } from "@/lib/blog";
import { blog, site } from "@/lib/content";
import { abs, breadcrumbNode, JsonLd, PERSON_ID, pageMetadata, WEBSITE_ID } from "@/lib/seo";

export const metadata = pageMetadata({
  title: blog.title,
  description: blog.description,
  path: "/blog",
  keywords: ["Bakul Ahmed blog", "netcode", "Colyseus", "WebRTC", "AI-assisted programming", "Next.js"],
});

export default function BlogPage() {
  const posts = getPosts();
  // A post marked `featured` is pinned; otherwise the newest leads.
  const lead = posts.find((p) => p.featured) ?? posts[0];

  return (
    <>
      <PageHeading
        eyebrow={
          <>
            {blog.title} · {posts.length} {posts.length === 1 ? "post" : "posts"} ·{" "}
            {/* A plain anchor: the feed is XML, not a page to client-navigate to. */}
            <a href="/feed.xml" className="inline-flex min-h-7 items-center text-accent hover:opacity-80">
              RSS
            </a>
          </>
        }
        lead={blog.lead}
      >
        {blog.heading}
      </PageHeading>

      {lead && (
        <section aria-label="Featured post" className="mb-5">
          <PostCard post={lead} feature priority />
        </section>
      )}

      {posts.length > 1 && (
        <Card delay={80}>
          <BlogBrowser posts={posts} pinned={lead?.slug} />
        </Card>
      )}

      <JsonLd
        graph={[
          {
            "@type": "Blog",
            "@id": `${abs("/blog")}#blog`,
            url: abs("/blog"),
            name: `${blog.title} — ${site.name}`,
            description: blog.description,
            inLanguage: "en",
            isPartOf: { "@id": WEBSITE_ID },
            author: { "@id": PERSON_ID },
            publisher: { "@id": PERSON_ID },
            blogPost: posts.map((p) => ({
              "@type": "BlogPosting",
              "@id": `${abs(`/blog/${p.slug}`)}#article`,
              url: abs(`/blog/${p.slug}`),
              headline: p.title,
              description: p.description,
              datePublished: p.date,
              dateModified: p.updated ?? p.date,
              image: abs(`/blog/${p.slug}/opengraph-image`),
              author: { "@id": PERSON_ID },
            })),
          },
          breadcrumbNode([{ name: blog.title, path: "/blog" }]),
        ]}
      />
    </>
  );
}
