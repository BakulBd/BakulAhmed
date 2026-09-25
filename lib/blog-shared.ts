/**
 * The parts of the blog that are safe in the browser — types and formatting.
 * lib/blog.ts reads the filesystem and runs Shiki, so client components import
 * from here instead.
 */
export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  category: string;
  tags: string[];
  cover: string;
  coverAlt: string;
  featured: boolean;
  draft: boolean;
  readingMinutes: number;
  words: number;
};

export const formatDate = (iso: string, month: "short" | "long" = "short") =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month, year: "numeric", timeZone: "UTC" }).format(new Date(iso));
