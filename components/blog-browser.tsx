"use client";

import { useDeferredValue, useMemo, useState } from "react";
import PostCard from "./post-card";
import type { PostMeta } from "@/lib/blog-shared";

/**
 * Search and category filter over the post list. Everything is already in the
 * page — this only hides cards — so it needs no index and no request, and
 * without JavaScript the full list simply shows.
 */
export default function BlogBrowser({ posts, pinned }: { posts: PostMeta[]; pinned?: string }) {
  const categories = useMemo(() => ["All", ...Array.from(new Set(posts.map((p) => p.category)))], [posts]);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const q = useDeferredValue(query.trim().toLowerCase());

  const filtering = category !== "All" || q !== "";
  const visible = posts.filter((p) => {
    // The pinned post is already shown above the list; it rejoins once a
    // filter is on, so a search never hides a match.
    if (!filtering) return p.slug !== pinned;
    if (category !== "All" && p.category !== category) return false;
    if (!q) return true;
    return [p.title, p.description, p.category, ...p.tags].some((s) => s.toLowerCase().includes(q));
  });

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label="Filter posts by category" className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const selected = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={selected}
                className={`rounded-full border px-4 py-2 text-[0.82rem] font-medium transition-colors duration-300 ${
                  selected
                    ? "border-transparent bg-accent text-accent-contrast"
                    : "border-line bg-panel-soft text-muted hover:border-accent/40 hover:text-fg"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        <label className="search tile flex min-h-[2.6rem] items-center gap-2.5 px-3.5 sm:w-60">
          <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0 text-muted">
            <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4.5 4.5" />
            </g>
          </svg>
          <span className="sr-only">Search posts</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts"
            className="w-full min-w-0 bg-transparent text-[0.85rem] text-fg outline-none placeholder:text-muted"
          />
        </label>
      </div>

      <ul className="grid gap-5 sm:grid-cols-2">
        {visible.map((post, i) => (
          <li key={post.slug}>
            <PostCard post={post} delay={i * 60} />
          </li>
        ))}
      </ul>

      <p aria-live="polite" className={visible.length ? "sr-only" : "text-[0.9rem] text-muted"}>
        {visible.length
          ? `${visible.length} post${visible.length === 1 ? "" : "s"}`
          : "No posts match that — try another word or category."}
      </p>
    </>
  );
}
