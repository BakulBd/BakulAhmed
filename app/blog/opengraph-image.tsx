import { formatDate, getPosts } from "@/lib/blog";
import { blog, site } from "@/lib/content";
import { renderOg, OG_SIZE } from "@/lib/og";

export const alt = `${blog.heading} — the blog of ${site.name}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  const posts = getPosts();
  return renderOg({
    variant: "blog",
    label: `Blog · ${posts.length} ${posts.length === 1 ? "post" : "posts"}`,
    title: blog.heading,
    posts: posts.map((p) => ({ title: p.title, date: formatDate(p.date, "long") })),
  });
}
