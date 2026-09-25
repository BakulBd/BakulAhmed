import Card from "@/components/card";
import { PageHeading } from "@/components/page-heading";
import PortfolioGrid from "@/components/portfolio-grid";
import { projects } from "@/lib/content";
import { abs, breadcrumbNode, JsonLd, PERSON_ID, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Portfolio",
  description:
    "Projects by Bakul Ahmed: a real-time multiplayer 3D game platform, a VS Code extension for AI-assisted programming research, and an AI-powered university proctoring platform.",
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
          {
            "@type": "ItemList",
            name: "Projects by Bakul Ahmed",
            url: abs("/portfolio"),
            itemListElement: projects.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "SoftwareSourceCode",
                name: p.name,
                description: p.summary,
                codeRepository: p.repo,
                ...(p.demo ? { url: p.demo } : {}),
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
