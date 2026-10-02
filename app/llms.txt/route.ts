import { getPosts } from "@/lib/blog";
import { about, blog, contactDetails, nav, profile, projects, site, socials } from "@/lib/content";
import { abs } from "@/lib/seo";

// Built once, like every other page.
export const dynamic = "force-static";

/**
 * /llms.txt — the site in plain Markdown for language models and answer
 * engines (llmstxt.org): who this is, what is here, and where the detail
 * lives. Generated from lib/content.ts, so it never drifts from the pages.
 */
export function GET() {
  const posts = getPosts();
  const plain = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1");
  const email = contactDetails.find((c) => c.label === "Email")?.value;
  const body = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    ...about.paragraphs.map(plain).flatMap((p) => [p, ""]),
    "## Pages",
    "",
    ...nav.map((n) => `- [${n.label}](${abs(n.href)})`),
    `- [CV (PDF)](${abs(profile.cv)})`,
    "",
    "## Projects",
    "",
    ...projects.map(
      (p) => `- [${p.name}](${p.demo ?? p.repo ?? abs("/portfolio")}): ${p.summary} Stack: ${p.stack.join(", ")}.`,
    ),
    "",
    `## ${blog.title}`,
    "",
    ...posts.map((p) => `- [${p.title}](${abs(`/blog/${p.slug}`)}): ${p.description}`),
    "",
    "## Contact",
    "",
    ...(email ? [`- Email: ${email}`] : []),
    ...socials.filter((s) => s.href.startsWith("http")).map((s) => `- ${s.label}: ${s.href}`),
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
