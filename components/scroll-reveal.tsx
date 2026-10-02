"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Reveals any element carrying [data-reveal] as it enters the viewport, so
 * sections stay server-rendered and ship no JavaScript of their own.
 *
 * Keyed on the pathname: a client-side navigation replaces the page's DOM,
 * and those new nodes start hidden by CSS. Without re-observing them after
 * each route change the incoming page stays blank until a full reload.
 */
export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>("[data-reveal]");

    const reveal = (el: HTMLElement) => {
      el.dataset.revealed = "true";
    };

    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      targets.forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );

    targets.forEach((el) => observer.observe(el));

    // Content that arrives after the page — a card brought back by a filter —
    // is a new node the observer has never seen, and it would stay hidden.
    // Watch the page content for it. Only on this path: where the browser
    // drives the reveal from scroll, CSS already shows new nodes.
    const main = document.getElementById("main");
    const added =
      main && !CSS.supports("animation-timeline: view()")
        ? new MutationObserver((records) => {
            for (const record of records) {
              record.addedNodes.forEach((node) => {
                if (!(node instanceof HTMLElement)) return;
                if (node.matches("[data-reveal]:not([data-revealed])")) observer.observe(node);
                node
                  .querySelectorAll<HTMLElement>("[data-reveal]:not([data-revealed])")
                  .forEach((el) => observer.observe(el));
              });
            }
          })
        : null;
    if (main) added?.observe(main, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      added?.disconnect();
    };
  }, [pathname]);

  return null;
}
