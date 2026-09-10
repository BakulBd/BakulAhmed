"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ArrowUpRight, GitHub } from "./icons";
import type { Project } from "@/lib/content";

export default function PortfolioGrid({ projects }: { projects: Project[] }) {
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(projects.map((p) => p.category)))],
    [projects],
  );
  const [active, setActive] = useState("All");
  const visible = active === "All" ? projects : projects.filter((p) => p.category === active);

  return (
    <>
      <div role="group" aria-label="Filter projects by category" className="mb-7 flex flex-wrap gap-2">
        {categories.map((category) => {
          const selected = active === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setActive(category)}
              aria-pressed={selected}
              className={`rounded-full border px-4 py-2 text-[0.82rem] font-medium transition-colors duration-300 ${
                selected
                  ? "border-transparent bg-accent text-accent-contrast"
                  : "border-line bg-panel-soft text-muted hover:border-accent/40 hover:text-fg"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      <ul className="grid gap-5 sm:grid-cols-2">
        {visible.map((project, i) => {
          const primary = project.demo ?? project.repo;
          return (
            <li
              key={project.slug}
              className="tile spotlight shine shine--hover group flex flex-col overflow-hidden transition-colors duration-300"
              data-reveal
              style={{ "--reveal-delay": `${i * 60}ms` } as React.CSSProperties}
            >
              <div className="relative aspect-[16/10] overflow-hidden border-b border-line-soft bg-panel">
                <Image
                  src={project.image}
                  alt={project.imageAlt}
                  fill
                  sizes="(min-width: 640px) 45vw, 90vw"
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(.22,.68,.28,1)] group-hover:scale-105"
                />
              </div>

              <div className="flex flex-1 flex-col p-5">
                <p className="eyebrow">
                  {project.category} · {project.year}
                </p>
                <h2 className="mt-2 text-[1.05rem] font-semibold text-fg">
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

                <ul className="mt-3 space-y-1.5">
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

                {(project.repo || project.demo) && (
                  <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-4">
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
