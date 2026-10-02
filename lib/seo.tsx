import type { Metadata } from "next";
import { awards, blog, contactDetails, profile, site, skills, socials, versions } from "./content";

export const feedLink = {
  "application/rss+xml": [{ url: "/feed.xml", title: `${blog.title} — ${site.name}` }],
};

/** Absolute URL on this site, from a path. */
export const abs = (path = "/") => new URL(path, site.url).toString().replace(/\/$/, "");

/** A post's share card (app/blog/[slug]/card.png/route.tsx). */
export const postCard = (slug: string) => abs(`/blog/${slug}/card.png`);

export const PERSON_ID = `${abs("/")}/#person`;
export const WEBSITE_ID = `${abs("/")}/#website`;
const UNIVERSITY_ID = `${abs("/")}/#university`;

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
  image,
}: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article" | "profile";
  /** Skip the "— Bakul Ahmed" template (the home page carries the name already). */
  absoluteTitle?: boolean;
  article?: { publishedTime: string; modifiedTime?: string; tags?: string[]; section?: string };
  keywords?: string[];
  /** A share card named explicitly, with its own alt — for routes whose card is
      not an opengraph-image file (blog posts). */
  image?: { url: string; alt: string };
}): Metadata {
  const images = image ? [{ url: image.url, width: 1200, height: 630, alt: image.alt, type: "image/png" }] : undefined;
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
      ...(images ? { images } : {}),
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, ...(images ? { images } : {}) },
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
  alumniOf: { "@id": UNIVERSITY_ID },
  // A current student: the university is also his affiliation.
  affiliation: {
    "@type": "CollegeOrUniversity",
    "@id": UNIVERSITY_ID,
    name: "Green University of Bangladesh",
    url: "https://green.edu.bd",
    address: { "@type": "PostalAddress", addressLocality: "Dhaka", addressCountry: "BD" },
  },
  // The role, not just the membership: schema.org's Role pattern lets the
  // position and its dates sit between the person and the organisation.
  memberOf: {
    "@type": "OrganizationRole",
    roleName: "General Secretary",
    startDate: "2026-03",
    memberOf: {
      "@type": "Organization",
      name: "Green University Computer Club",
      alternateName: "GUCC",
      parentOrganization: { "@id": UNIVERSITY_ID },
    },
  },
  knowsLanguage: [
    { "@type": "Language", name: "English", alternateName: "en" },
    { "@type": "Language", name: "Bengali", alternateName: "bn" },
  ],
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
  // What he does, as an occupation with its skills — the shape Google's
  // profile and people features read, rather than a bare job title.
  hasOccupation: {
    "@type": "Occupation",
    name: "Full-Stack Developer",
    description: profile.intro,
    occupationLocation: { "@type": "City", name: "Dhaka" },
    skills: skills.flatMap((g) => g.items).join(", "),
  },
  workLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: "Dhaka", addressCountry: "BD" } },
} as const;

export const websiteNode = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: site.name,
  // What Google may show as the site name in results, and the names people
  // actually search for him by.
  alternateName: ["Bakul", "BakulBd", `${site.name} Portfolio`],
  url: abs("/"),
  inLanguage: "en",
  description: site.description,
  publisher: { "@id": PERSON_ID },
  author: { "@id": PERSON_ID },
} as const;

/**
 * The page itself, tied into the graph: part of the website, about the
 * person. Without it each route's JSON-LD was a breadcrumb and a free-floating
 * node; with it search engines see one site, one person, and what each page is.
 */
export function webPageNode({
  path,
  name,
  description,
  type = "WebPage",
  mainEntity,
}: {
  path: string;
  name: string;
  description: string;
  type?: "WebPage" | "CollectionPage" | "ContactPage" | "AboutPage";
  mainEntity?: object;
}) {
  const url = abs(path);
  return {
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: "en",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": PERSON_ID },
    primaryImageOfPage: { "@id": `${abs("/")}/#portrait` },
    ...(mainEntity ? { mainEntity } : {}),
  };
}

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
