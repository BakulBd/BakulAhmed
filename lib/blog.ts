/**
 * The blog: Markdown files in content/blog, rendered to HTML at build time.
 *
 * Everything here runs during `next build` and never ships to the browser —
 * the post pages are static HTML, code is highlighted by Shiki at build time
 * (no highlighter in the bundle), and the only script a post page loads is
 * the site's own.
 *
 * To publish: add `content/blog/<slug>.md` with the frontmatter below. The
 * slug is the filename. `draft: true` hides a post in production builds.
 *
 *   ---
 *   title: Keeping a 3D multiplayer game in sync
 *   description: One or two sentences — this is the search-result snippet.
 *   date: 2026-06-12
 *   updated: 2026-07-01          (optional)
 *   category: Engineering
 *   tags: [netcode, colyseus]
 *   cover: /work/web-game.svg
 *   coverAlt: What the cover shows, for screen readers.
 *   featured: true               (optional — pins the post to the top)
 *   draft: false                 (optional)
 *   ---
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Marked, type Tokens } from "marked";
import { createHighlighter, type Highlighter } from "shiki";
import { createCssVariablesTheme } from "shiki/core";
import type { PostMeta } from "./blog-shared";

export { formatDate, type PostMeta } from "./blog-shared";

const DIR = join(process.cwd(), "content", "blog");
const WORDS_PER_MINUTE = 225;

export type TocEntry = { id: string; text: string; depth: 2 | 3 };
export type Post = PostMeta & { html: string; toc: TocEntry[] };

/* ---------------------------------------------------------------- *
 * Frontmatter — a deliberately small YAML subset: `key: value`,
 * quoted strings, booleans and inline `[a, b]` lists. Anything more
 * elaborate belongs in the post body.
 * ---------------------------------------------------------------- */
function parseFrontmatter(file: string, source: string) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  if (!match) throw new Error(`${file}: missing --- frontmatter ---`);
  const data: Record<string, string | boolean | string[]> = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const i = line.indexOf(":");
    if (i < 0) throw new Error(`${file}: cannot parse frontmatter line "${line}"`);
    const key = line.slice(0, i).trim();
    const raw = line.slice(i + 1).trim();
    data[key] = parseValue(raw);
  }
  return { data, body: source.slice(match[0].length) };
}

function parseValue(raw: string): string | boolean | string[] {
  if (raw === "true" || raw === "false") return raw === "true";
  if (raw.startsWith("[") && raw.endsWith("]")) {
    return raw
      .slice(1, -1)
      .split(",")
      .map((s) => unquote(s.trim()))
      .filter(Boolean);
  }
  return unquote(raw);
}

const unquote = (s: string) => (/^(["']).*\1$/.test(s) ? s.slice(1, -1) : s);

function required(file: string, data: Record<string, unknown>, key: string): string {
  const v = data[key];
  if (typeof v !== "string" || !v) throw new Error(`${file}: frontmatter needs "${key}"`);
  return v;
}

/* ---------------------------------------------------------------- *
 * Markdown
 * ---------------------------------------------------------------- */
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;|&#\d+;/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const decode = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

const LANGS = ["ts", "tsx", "js", "jsx", "json", "bash", "shell", "css", "html", "diff", "yaml", "python", "nginx"];
const LANG_LABEL: Record<string, string> = {
  ts: "TypeScript", tsx: "TSX", js: "JavaScript", jsx: "JSX", json: "JSON", bash: "Shell", shell: "Shell",
  sh: "Shell", css: "CSS", html: "HTML", diff: "Diff", yaml: "YAML", python: "Python", py: "Python",
  nginx: "Nginx", text: "Text", txt: "Text",
};

/**
 * Colours come from CSS variables rather than a fixed theme, so code blocks
 * are re-lit with the rest of the page when the mood changes — keywords take
 * the mood's accent, functions its second accent. See `.prose pre` in
 * globals.css for the mapping.
 */
const theme = createCssVariablesTheme({ name: "site", variablePrefix: "--shiki-", fontStyle: true });

let highlighter: Promise<Highlighter> | undefined;
const getHighlighter = () => (highlighter ??= createHighlighter({ themes: [theme], langs: LANGS }));

async function highlight(code: string, lang: string) {
  const hl = await getHighlighter();
  const alias: Record<string, string> = { sh: "bash", py: "python", typescript: "ts", javascript: "js" };
  const id = alias[lang] ?? lang;
  const known = hl.getLoadedLanguages().includes(id);
  const label = LANG_LABEL[lang] ?? (lang || "Text");
  const html = known
    ? hl.codeToHtml(code, { lang: id, theme: "site" })
    : `<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`;
  // The copy button is plain markup; one delegated listener (CodeCopy) wires
  // every button on the page, so posts stay server components.
  return (
    `<figure class="code" data-lang="${escapeHtml(label)}">` +
    `<figcaption class="code__bar"><span>${escapeHtml(label)}</span>` +
    `<button type="button" class="code__copy" data-copy aria-label="Copy code">Copy</button></figcaption>` +
    html +
    `</figure>`
  );
}

async function renderMarkdown(body: string) {
  const toc: TocEntry[] = [];
  const used = new Map<string, number>();
  const marked = new Marked({ gfm: true, async: true });

  // Highlight up front: Shiki is async, and marked's renderer is not.
  const tokens = marked.lexer(body);
  const pending: Promise<void>[] = [];
  marked.walkTokens(tokens, (token) => {
    if (token.type !== "code") return;
    const code = token as Tokens.Code & { highlighted?: string };
    pending.push(
      highlight(code.text, (code.lang ?? "").trim().split(/\s/)[0]).then((html) => {
        code.highlighted = html;
      }),
    );
  });
  await Promise.all(pending);

  marked.use({
    renderer: {
      code(token) {
        return (token as Tokens.Code & { highlighted?: string }).highlighted ?? false;
      },
      heading({ tokens: inline, depth }) {
        const html = this.parser.parseInline(inline);
        if (depth < 2 || depth > 3) return `<h${depth}>${html}</h${depth}>\n`;
        const base = slugify(html) || "section";
        const n = used.get(base) ?? 0;
        used.set(base, n + 1);
        const id = n ? `${base}-${n}` : base;
        toc.push({ id, text: decode(html.replace(/<[^>]+>/g, "")), depth: depth as 2 | 3 });
        return (
          `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>` +
          `${html}</h${depth}>\n`
        );
      },
      link({ href, title, tokens: inline }) {
        const text = this.parser.parseInline(inline);
        const external = /^https?:\/\//.test(href);
        const t = title ? ` title="${escapeHtml(title)}"` : "";
        return external
          ? `<a href="${escapeHtml(href)}"${t} target="_blank" rel="noopener noreferrer">${text}</a>`
          : `<a href="${escapeHtml(href)}"${t}>${text}</a>`;
      },
      image({ href, title, text }) {
        const caption = title ? `<figcaption>${escapeHtml(title)}</figcaption>` : "";
        return (
          `<figure class="figure"><img src="${escapeHtml(href)}" alt="${escapeHtml(text)}" ` +
          `loading="lazy" decoding="async" />${caption}</figure>`
        );
      },
      // Wide tables scroll inside their own box instead of the whole page.
      table(token) {
        const head = token.header.map((c) => `<th${c.align ? ` style="text-align:${c.align}"` : ""}>${this.parser.parseInline(c.tokens)}</th>`).join("");
        const rows = token.rows
          .map((r) => `<tr>${r.map((c) => `<td${c.align ? ` style="text-align:${c.align}"` : ""}>${this.parser.parseInline(c.tokens)}</td>`).join("")}</tr>`)
          .join("");
        return `<div class="table-wrap" tabindex="0"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
      },
    },
  });

  const html = await marked.parser(tokens);
  return { html, toc };
}

/* ---------------------------------------------------------------- *
 * Loading
 * ---------------------------------------------------------------- */
const showDrafts = process.env.NODE_ENV !== "production";

function countWords(markdown: string) {
  const prose = markdown.replace(/```[\s\S]*?```/g, " ").replace(/[#>*_`[\]()!|-]/g, " ");
  const words = prose.split(/\s+/).filter(Boolean).length;
  // Code is read more slowly than prose; count each block as a minute's worth.
  const blocks = (markdown.match(/```/g)?.length ?? 0) / 2;
  return { words, minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE + blocks * 0.35)) };
}

function load(file: string) {
  const source = readFileSync(join(DIR, file), "utf8");
  const { data, body } = parseFrontmatter(file, source);
  const { words, minutes } = countWords(body);
  const meta: PostMeta = {
    slug: file.replace(/\.md$/, ""),
    title: required(file, data, "title"),
    description: required(file, data, "description"),
    date: required(file, data, "date"),
    updated: typeof data.updated === "string" ? data.updated : undefined,
    category: required(file, data, "category"),
    tags: Array.isArray(data.tags) ? data.tags : [],
    cover: required(file, data, "cover"),
    coverAlt: required(file, data, "coverAlt"),
    featured: data.featured === true,
    draft: data.draft === true,
    readingMinutes: minutes,
    words,
  };
  if (Number.isNaN(Date.parse(meta.date))) throw new Error(`${file}: date "${meta.date}" is not YYYY-MM-DD`);
  return { meta, body };
}

let cache: { meta: PostMeta; body: string }[] | undefined;

function all() {
  cache ??= readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map(load)
    .filter((p) => showDrafts || !p.meta.draft)
    .sort((a, b) => b.meta.date.localeCompare(a.meta.date));
  return cache;
}

/** Every published post, newest first. */
export function getPosts(): PostMeta[] {
  return all().map((p) => p.meta);
}

export async function getPost(slug: string): Promise<Post | undefined> {
  const entry = all().find((p) => p.meta.slug === slug);
  if (!entry) return undefined;
  const { html, toc } = await renderMarkdown(entry.body);
  return { ...entry.meta, html, toc };
}

/** Newer and older neighbours, for the links at the foot of a post. */
export function getAdjacent(slug: string) {
  const posts = getPosts();
  const i = posts.findIndex((p) => p.slug === slug);
  return { newer: i > 0 ? posts[i - 1] : undefined, older: i >= 0 ? posts[i + 1] : undefined };
}

/** Posts sharing the most tags, then the same category, then the newest. */
export function getRelated(slug: string, limit = 2) {
  const posts = getPosts();
  const me = posts.find((p) => p.slug === slug);
  if (!me) return [];
  return posts
    .filter((p) => p.slug !== slug)
    .map((p) => ({
      p,
      score: p.tags.filter((t) => me.tags.includes(t)).length * 2 + (p.category === me.category ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || b.p.date.localeCompare(a.p.date))
    .slice(0, limit)
    .map((x) => x.p);
}

/** Rendered HTML for every post — used by the RSS feed. */
export async function getPostsWithHtml() {
  return Promise.all(getPosts().map(async (p) => (await getPost(p.slug))!));
}
