import type { Metadata } from "next";
import { awards, blog, contactDetails, profile, site, socials, versions } from "./content";

export const feedLink = {
  "application/rss+xml": [{ url: "/feed.xml", title: `${blog.title} — ${site.name}` }],
};

/** Absolute URL on this site, from a path. */
export const abs = (path = "/") => new URL(path, site.url).toString().replace(/\/$/, "");

export const PERSON_ID = `${abs("/")}/#person`;
export const WEBSITE_ID = `${abs("/")}/#website`;

/**
 * Per-route metadata. Without this every route inherited the root layout's
 * openGraph block wholesale — so /resume shared its og:url and og:title with
 * the home page, and a link to it unfurled as the home page.
 */
export function pageMetadata({
  title,
  description,
  path,
  type = "website",
  absoluteTitle = false,
  article,
  keywords,
}: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article" | "profile";
  /** Skip the "— Bakul Ahmed" template (the home page carries the name already). */
  absoluteTitle?: boolean;
  article?: { publishedTime: string; modifiedTime?: string; tags?: string[]; section?: string };
  keywords?: string[];
}): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} — ${site.name}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    keywords,
    // Next replaces `alternates` wholesale per route, so the feed link has to
    // be restated here or every page but the layout's default loses it.
    alternates: { canonical: path, types: feedLink },
    openGraph: {
      type,
      url: path,
      siteName: site.name,
      locale: site.locale,
      title: fullTitle,
      description,
      ...(type === "profile" ? { firstName: "Bakul", lastName: "Ahmed", username: "BakulBd" } : {}),
      ...(article
        ? {
            publishedTime: article.publishedTime,
            modifiedTime: article.modifiedTime ?? article.publishedTime,
            authors: [abs("/")],
            tags: article.tags,
            section: article.section,
          }
        : {}),
    },
    twitter: { card: "summary_large_image", title: fullTitle, description },
  };
}

/** The canonical portrait — what Google and link previews should show for this person. */
export const portrait = {
  url: abs(profile.image.src),
  width: profile.image.width,
  height: profile.image.height,
};

/** One Person node, referenced by @id from every other node on the site. */
export const personNode = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: site.name,
  givenName: "Bakul",
  familyName: "Ahmed",
  alternateName: "BakulBd",
  jobTitle: profile.role,
  description: site.description,
  url: abs("/"),
  image: {
    "@type": "ImageObject",
    "@id": `${abs("/")}/#portrait`,
    url: portrait.url,
    contentUrl: portrait.url,
    width: portrait.width,
    height: portrait.height,
    caption: site.name,
  },
  email: `mailto:${contactDetails[0].value}`,
  telephone: contactDetails[1].value,
  address: { "@type": "PostalAddress", addressLocality: "Dhaka", addressCountry: "BD" },
  nationality: { "@type": "Country", name: "Bangladesh" },
  // Your other sites count as the same entity; that is what sameAs is for.
  sameAs: [...socials.filter((s) => s.href.startsWith("http")).map((s) => s.href), ...versions.map((v) => v.href)],
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "Green University of Bangladesh",
    address: { "@type": "PostalAddress", addressLocality: "Dhaka", addressCountry: "BD" },
  },
  memberOf: { "@type": "Organization", name: "Green University Computer Club" },
  knowsAbout: [
    "Software Engineering",
    "Full-Stack Web Development",
    "Artificial Intelligence",
    "Machine Learning",
    "Natural Language Processing",
    "Real-time Multiplayer Networking",
    "Data Structures and Algorithms",
  ],
  award: awards.map((a) => `${a.title} — ${a.org}`),
} as const;

export const websiteNode = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: site.name,
  url: abs("/"),
  inLanguage: "en",
  description: site.description,
  publisher: { "@id": PERSON_ID },
  author: { "@id": PERSON_ID },
} as const;

export function breadcrumbNode(trail: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...trail].map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: abs(item.path),
    })),
  };
}

/** A JSON-LD graph as a script tag. `<` is escaped so content can never close the tag. */
export function JsonLd({ graph }: { graph: object[] }) {
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
