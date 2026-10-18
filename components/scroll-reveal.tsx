"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** The longest a reveal can take: the 600ms fade plus the largest stagger. */
const SETTLE = 1200;

/**
 * Fades [data-reveal] cards up as they arrive — but only cards that were
 * below the fold when the page opened. Anything already on screen is never
 * touched: it paints whole on the first frame, so nothing on arrival looks
 * half-there or cut off, and the largest heading on screen is never held back
 * for the script (which Lighthouse would count against LCP).
 *
 * The fade is on a clock, not the scroll position: once a card starts to come
 * into view it finishes its 600ms and is done, rather than sitting at half
 * opacity for as long as it stays at the bottom edge of the screen.
 *
 * Keyed on the pathname: a client-side navigation brings a new page's cards,
 * and they are sorted into on-screen and below-the-fold afresh. Cards added
 * later (one a filter brings back) are not marked at all, so never hidden.
 */
export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timers = new Set<number>();
    const show = (el: HTMLElement) => {
      el.dataset.revealState = "in";
      // Once it has settled, step out of the way: the reveal's transition
      // must not linger on the card's own hover lift and lean.
      const t = window.setTimeout(() => {
        timers.delete(t);
        if (el.dataset.revealState === "in") delete el.dataset.revealState;
      }, SETTLE);
      timers.add(t);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          show(entry.target as HTMLElement);
        }
      },
      // The moment any of it enters the window. A negative bottom margin
      // (it was -6%) left whatever sits at the very end of a page — where the
      // scroll cannot bring it further up — hidden for good on a short
      // landscape phone.
      { rootMargin: "0px", threshold: 0 },
    );

    const fold = window.innerHeight;
    // Cards fade up; section headings draw their chapter line.
    document.querySelectorAll<HTMLElement>("[data-reveal], .section-title").forEach((el) => {
      // Already on screen (even by a pixel), or hidden — leave it alone.
      const box = el.getBoundingClientRect();
      if (box.top < fold || (box.width === 0 && box.height === 0)) return;
      el.dataset.revealState = "pending";
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
      // A page left mid-reveal must not leave anything hidden behind.
      document.querySelectorAll<HTMLElement>("[data-reveal-state]").forEach((el) => {
        delete el.dataset.revealState;
      });
    };
  }, [pathname]);

  return null;
}
