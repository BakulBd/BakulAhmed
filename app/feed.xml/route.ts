import { getPostsWithHtml } from "@/lib/blog";
import { blog, profile, site } from "@/lib/content";
import { abs } from "@/lib/seo";

// Built once, served as a static file.
export const dynamic = "force-static";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// Full post HTML goes in CDATA; a literal "]]>" inside it would end the section early.
const cdata = (s: string) => `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
// Root-relative links in a post would resolve against the feed reader, not this site.
const absolutize = (html: string) => html.replace(/(href|src)="\/(?!\/)/g, `$1="${abs("/")}/`);

/** RSS 2.0 with full content, so readers show the whole post rather than a teaser. */
export async function GET() {
  const posts = await getPostsWithHtml();
  const updated = posts[0] ? new Date(posts[0].updated ?? posts[0].date) : new Date();

  const items = posts
    .map((p) => {
      const url = abs(`/blog/${p.slug}`);
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <dc:creator>${esc(site.name)}</dc:creator>
      <category>${esc(p.category)}</category>
${p.tags.map((t) => `      <category>${esc(t)}</category>`).join("\n")}
      <description>${esc(p.description)}</description>
      <content:encoded>${cdata(absolutize(p.html))}</content:encoded>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${esc(`${blog.title} — ${site.name}`)}</title>
    <link>${abs("/blog")}</link>
    <atom:link href="${abs("/feed.xml")}" rel="self" type="application/rss+xml" />
    <description>${esc(blog.description)}</description>
    <language>en</language>
    <lastBuildDate>${updated.toUTCString()}</lastBuildDate>
    <image>
      <url>${abs(profile.image.src)}</url>
      <title>${esc(`${blog.title} — ${site.name}`)}</title>
      <link>${abs("/blog")}</link>
    </image>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
