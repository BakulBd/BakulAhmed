"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, GitHub } from "./icons";
import FilterChip, { countBy } from "./filter-chip";
import ProjectArt from "./project-art";
import { withViewTransition } from "./view-transition";
import type { Project } from "@/lib/content";

export default function PortfolioGrid({ projects }: { projects: Project[] }) {
  const counts = useMemo(() => countBy(projects, (p) => p.category), [projects]);
  const categories = [...counts.keys()];
  const [active, setActive] = useState("All");
  const visible = active === "All" ? projects : projects.filter((p) => p.category === active);

  return (
    <>
      <div role="group" aria-label="Filter projects by category" className="mb-7 flex flex-wrap gap-2">
        {categories.map((category) => (
          <FilterChip
            key={category}
            label={category}
            count={counts.get(category) ?? 0}
            unit="project"
            selected={active === category}
            onSelect={() => withViewTransition(() => setActive(category))}
          />
        ))}
      </div>

      <ul className="grid gap-5 sm:grid-cols-2">
        {visible.map((project, i) => {
          const primary = project.demo ?? project.repo;
          // An odd count would leave a hole beside the last card; the lead
          // card takes the full row instead — a wide banner of its art over
          // two columns of text — so the grid always closes square. That
          // includes a filter that leaves one project: it fills the row
          // rather than sitting beside an empty column.
          const wide = i === 0 && visible.length % 2 === 1;
          return (
            <li
              key={project.slug}
              className={`tile spotlight shine shine--hover tilt lazy-card group flex flex-col overflow-hidden transition-colors duration-300 ${
                wide ? "sm:col-span-2" : ""
              }`}
              data-reveal
              style={{ "--reveal-delay": `${i * 60}ms`, viewTransitionName: `project-${project.slug}` } as React.CSSProperties}
            >
              <div
                className={`relative aspect-[16/10] shrink-0 overflow-hidden border-b border-line-soft bg-panel ${
                  wide ? "md:aspect-[16/7]" : ""
                }`}
              >
                <ProjectArt
                  src={project.image}
                  alt={project.imageAlt}
                  uid={`grid-${project.slug}`}
                  sizes={wide ? "(min-width: 640px) 90vw, 90vw" : "(min-width: 640px) 45vw, 90vw"}
                  className="duration-700 group-hover:scale-105"
                />
              </div>

              <div className={`flex flex-1 flex-col p-5 ${wide ? "md:grid md:grid-cols-2 md:gap-x-10 md:p-7" : ""}`}>
                <div>
                  <p className="eyebrow">
                    {project.category} · {project.year}
                  </p>
                  <h2 className={`mt-2 font-semibold text-fg ${wide ? "text-[1.05rem] md:text-[1.4rem]" : "text-[1.05rem]"}`}>
                    {primary ? (
                      <a
                        href={primary}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex min-h-[2rem] items-center gap-1.5 transition-colors duration-300 hover:text-accent"
                      >
                        {project.name}
                        <ArrowUpRight
                          width={15}
                          height={15}
                          className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        />
                      </a>
                    ) : (
                      project.name
                    )}
                  </h2>
                  <p className="mt-1 text-[0.8rem] text-accent">{project.subtitle}</p>
                  <p className="mt-2 text-[0.85rem] leading-[1.7] text-muted">{project.summary}</p>
                </div>

                <div className="flex flex-1 flex-col">
                  <ul className={`mt-3 space-y-1.5 ${wide ? "md:mt-1" : ""}`}>
                    {project.points.map((point) => (
                      <li
                        key={point}
                        className="grid grid-cols-[auto_1fr] gap-x-2.5 text-[0.8rem] leading-[1.65] text-muted"
                      >
                        <span aria-hidden="true" className="pt-[0.5rem]">
                          <span className="block size-1 rounded-full bg-accent" />
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  <ul className="mt-3 mb-1 flex flex-wrap gap-1.5">
                    {project.stack.map((tech) => (
                      <li
                        key={tech}
                        className="rounded-full border border-line bg-panel px-2.5 py-1 text-[0.72rem] text-muted"
                      >
                        {tech}
                      </li>
                    ))}
                  </ul>

                  {(project.repo || project.demo || project.post) && (
                    <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-4">
                      {project.post && (
                        <Link
                          href={`/blog/${project.post}`}
                          className="inline-flex min-h-[2rem] items-center gap-1.5 text-[0.82rem] font-medium text-accent transition-opacity duration-300 hover:opacity-80"
                        >
                          Read the write-up
                          <span className="sr-only"> — {project.name}</span>
                        </Link>
                      )}
                      {project.repo && (
                        <a
                          href={project.repo}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex min-h-[2rem] items-center gap-1.5 text-[0.82rem] text-muted transition-colors duration-300 hover:text-accent"
                        >
                          <GitHub width={14} height={14} />
                          Source
                          <span className="sr-only"> — {project.name} repository</span>
                        </a>
                      )}
                      {project.demo && (
                        <a
                          href={project.demo}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex min-h-[2rem] items-center gap-1.5 text-[0.82rem] text-muted transition-colors duration-300 hover:text-accent"
                        >
                          Live demo
                          <ArrowUpRight width={13} height={13} />
                          <span className="sr-only"> — {project.name}</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {visible.length === 0 && (
        <p className="text-[0.9rem] text-muted">Nothing in this category yet.</p>
      )}
    </>
  );
}
