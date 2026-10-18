"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { contactDetails, nav, profile, projects, recognitions, site, socials } from "@/lib/content";

type ToolResult = { content: { type: "text"; text: string }[] };
type Tool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean };
  execute: (input: Record<string, unknown>) => Promise<ToolResult>;
};
type ModelContext = {
  registerTool?: (tool: Tool, options?: { signal?: AbortSignal }) => { unregister?: () => void } | void;
  unregisterTool?: (name: string) => void;
};

const text = (value: unknown): ToolResult => ({
  content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }],
});
const absolute = (path: string) => new URL(path, site.url).toString();
const pages = nav.map((n) => n.href) as string[];

/**
 * WebMCP tools (https://developer.chrome.com/docs/ai/webmcp): what an AI
 * agent browsing on someone's behalf can ask this site directly, instead of
 * scraping it. Read-only questions about the person and the work, plus
 * moving between pages. Sending a message is the contact form's own
 * declarative tool, so it stays a form the visitor can see and confirm.
 *
 * Registers nothing, and costs nothing, in a browser without WebMCP.
 */
export default function AgentTools() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    const mc = (navigator as Navigator & { modelContext?: ModelContext }).modelContext;
    if (!mc?.registerTool) return;

    const tools: Tool[] = [
      {
        name: "get_profile",
        description: `Who ${site.name} is: role, summary, location, availability, contact details, profiles and CV link.`,
        inputSchema: { type: "object", properties: {} },
        annotations: { readOnlyHint: true },
        execute: async () =>
          text({
            name: site.name,
            title: site.title,
            summary: profile.intro,
            location: profile.location,
            status: profile.status,
            roles: profile.roles,
            contact: contactDetails.map(({ label, value }) => ({ label, value })),
            profiles: socials.filter((s) => s.href.startsWith("http")).map(({ label, href }) => ({ label, url: href })),
            cv: absolute(profile.cv),
          }),
      },
      {
        name: "list_projects",
        description: `Projects ${site.name} has built, with summary, stack, source repository, demo and write-up links.`,
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              enum: [...new Set(projects.map((p) => p.category))],
              description: "Only projects in this category.",
            },
          },
        },
        annotations: { readOnlyHint: true },
        execute: async (input) =>
          text(
            projects
              .filter((p) => !input?.category || p.category === input.category)
              .map((p) => ({
                name: p.name,
                category: p.category,
                year: p.year,
                summary: p.summary,
                stack: p.stack,
                repository: p.repo,
                demo: p.demo,
                writeUp: p.post ? absolute(`/blog/${p.post}`) : undefined,
              })),
          ),
      },
      {
        name: "list_recognition",
        description:
          "Awards and gallery listings this site has received, each with the issuer's verification URL. Listings are not awards.",
        inputSchema: { type: "object", properties: {} },
        annotations: { readOnlyHint: true },
        execute: async () =>
          text(
            recognitions.map((r) => ({
              title: r.title,
              kind: r.kind === "award" ? "award" : "gallery listing (not an award)",
              issuer: r.issuer,
              date: r.date,
              summary: r.summary,
              details: Object.fromEntries(r.facts.map((f) => [f.label, f.value])),
              verify: r.verifyUrl,
              document: r.document ? absolute(r.document.href) : undefined,
            })),
          ),
      },
      {
        name: "open_page",
        description: `Navigate this site to one of its pages: ${nav.map((n) => `${n.label} (${n.href})`).join(", ")}.`,
        inputSchema: {
          type: "object",
          properties: { path: { type: "string", enum: pages, description: "The page to open." } },
          required: ["path"],
        },
        execute: async (input) => {
          const path = String(input?.path ?? "");
          if (!pages.includes(path)) return text(`Unknown page "${path}". Pages: ${pages.join(", ")}.`);
          routerRef.current.push(path);
          return text(`Opened ${absolute(path)}.`);
        },
      },
    ];

    const controller = new AbortController();
    const handles = tools.map((tool) => {
      try {
        return mc.registerTool!(tool, { signal: controller.signal });
      } catch {
        return undefined;
      }
    });
    return () => {
      controller.abort();
      handles.forEach((h, i) => {
        try {
          if (h && typeof h.unregister === "function") h.unregister();
          else mc.unregisterTool?.(tools[i].name);
        } catch {
          // Already gone with the signal.
        }
      });
    };
  }, []);

  return null;
}
