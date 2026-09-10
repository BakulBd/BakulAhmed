import type { Metadata } from "next";
import Card from "@/components/card";
import { PageHeading } from "@/components/page-heading";
import PortfolioGrid from "@/components/portfolio-grid";
import { projects } from "@/lib/content";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Selected software, AI and open-source projects built by Bakul Ahmed.",
  alternates: { canonical: "/portfolio" },
};

export default function PortfolioPage() {
  return (
    <>
      <PageHeading lead="Three projects I built end to end — a real-time game platform, a research tool for AI-assisted programming, and an AI university platform.">Portfolio</PageHeading>
      <Card>
        <PortfolioGrid projects={projects} />
      </Card>
    </>
  );
}
