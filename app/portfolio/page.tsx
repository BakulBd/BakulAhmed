import Card from "@/components/card";
import { PageHeading } from "@/components/page-heading";
import PortfolioGrid from "@/components/portfolio-grid";
import { projects } from "@/lib/content";
import { abs, breadcrumbNode, JsonLd, PERSON_ID, pageMetadata, webPageNode } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Projects: Multiplayer, AI and Developer Tools",
  description:
    "Projects by Bakul Ahmed: a real-time multiplayer 3D game platform, a VS Code extension for AI-assisted programming research, and an AI proctoring platform.",
  path: "/portfolio",
});

export default function PortfolioPage() {
  return (
    <>
      <PageHeading lead="Three projects I built end to end — a real-time game platform, a research tool for AI-assisted programming, and an AI university platform.">Portfolio</PageHeading>
      <Card>
        <PortfolioGrid projects={projects} />
      </Card>
      <JsonLd
        graph={[
          webPageNode({
            path: "/portfolio",
            name: "Projects by Bakul Ahmed",
            description: "A real-time multiplayer 3D game platform, a VS Code research extension and an AI proctoring platform.",
            type: "CollectionPage",
            mainEntity: { "@id": `${abs("/portfolio")}#projects` },
          }),
          {
            "@type": "ItemList",
            "@id": `${abs("/portfolio")}#projects`,
            name: "Projects by Bakul Ahmed",
            url: abs("/portfolio"),
            numberOfItems: projects.length,
            itemListElement: projects.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "SoftwareSourceCode",
                name: p.name,
                description: p.summary,
                codeRepository: p.repo,
                url: p.demo ?? p.repo,
                image: abs(p.image),
                ...(p.post ? { subjectOf: { "@type": "BlogPosting", url: abs(`/blog/${p.post}`) } } : {}),
                programmingLanguage: "TypeScript",
                keywords: p.stack.join(", "),
                dateCreated: p.year,
                author: { "@id": PERSON_ID },
              },
            })),
          },
          breadcrumbNode([{ name: "Portfolio", path: "/portfolio" }]),
        ]}
      />
    </>
  );
}
