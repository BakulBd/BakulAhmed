"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import FilterChip, { countBy } from "./filter-chip";
import PostCard from "./post-card";
import { withViewTransition } from "./view-transition";
import type { PostMeta } from "@/lib/blog-shared";

/**
 * Search and category filter over the post list. Everything is already in the
 * page — this only hides cards — so it needs no index and no request, and
 * without JavaScript the full list simply shows.
 */
export default function BlogBrowser({ posts, pinned }: { posts: PostMeta[]; pinned?: string }) {
  const counts = useMemo(() => countBy(posts, (p) => p.category), [posts]);
  const categories = [...counts.keys()];
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const q = useDeferredValue(query.trim().toLowerCase());
  const search = useRef<HTMLInputElement>(null);

  // "/" jumps to the search box, as it does on most developer sites — unless
  // the visitor is already typing somewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable]")) return;
      e.preventDefault();
      search.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const filtering = category !== "All" || q !== "";
  const visible = posts.filter((p) => {
    // The pinned post is already shown above the list; it rejoins once a
    // filter is on, so a search never hides a match.
    if (!filtering) return p.slug !== pinned;
    if (category !== "All" && p.category !== category) return false;
    if (!q) return true;
    return [p.title, p.description, p.category, ...p.tags].some((s) => s.toLowerCase().includes(q));
  });

  const shown = visible.length + (!filtering && pinned ? 1 : 0);

  return (
    <>
      {/* Chips and search share a row only when the bar itself is wide
          enough — the panel's width depends on the sidebar, not just the
          viewport, so this asks the container, not the screen. */}
      <div className="@container mb-7">
        <div className="flex flex-col gap-4 @min-[44rem]:flex-row @min-[44rem]:items-center @min-[44rem]:justify-between">
        <div role="group" aria-label="Filter posts by category" className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <FilterChip
              key={c}
              label={c}
              count={counts.get(c) ?? 0}
              unit="post"
              selected={category === c}
              onSelect={() => withViewTransition(() => setCategory(c))}
            />
          ))}
        </div>

        <label className="search tile flex min-h-[2.6rem] w-full max-w-sm items-center gap-2.5 px-3.5 @min-[44rem]:w-64">
          <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0 text-muted">
            <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4.5 4.5" />
            </g>
          </svg>
          <span className="sr-only">Search posts</span>
          <input
            ref={search}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts"
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
            className="w-full min-w-0 bg-transparent text-[0.85rem] text-fg outline-none placeholder:text-muted"
          />
          <kbd aria-hidden="true" className="kbd">
            /
          </kbd>
        </label>
        </div>
      </div>

      <ul className="grid gap-5 sm:grid-cols-2">
        {visible.map((post, i) => (
          <li key={post.slug} style={{ viewTransitionName: `post-${post.slug}` }}>
            <PostCard post={post} delay={i * 60} />
          </li>
        ))}
      </ul>

      <p aria-live="polite" className={visible.length ? "sr-only" : "text-[0.9rem] text-muted"}>
        {visible.length
          ? // What the page shows: unfiltered, that includes the pinned post
            // above the list, so it agrees with the "All" chip's count.
            `${shown} post${shown === 1 ? "" : "s"}`
          : "No posts match that — try another word or category."}
      </p>
    </>
  );
}
