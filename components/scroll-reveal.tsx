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
    if (targets.length === 0) return;

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
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
