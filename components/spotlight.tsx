"use client";

import { useEffect } from "react";

/**
 * Mounted once. Tracks the pointer over any `.spotlight` element and writes
 * its local coordinates as CSS custom properties, so the cards themselves stay
 * server-rendered and ship no JavaScript.
 */
export default function Spotlight() {
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let pending: { el: HTMLElement; x: number; y: number } | null = null;

    const flush = () => {
      frame = 0;
      if (!pending) return;
      pending.el.style.setProperty("--mx", `${pending.x}px`);
      pending.el.style.setProperty("--my", `${pending.y}px`);
      pending = null;
    };

    const onMove = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const el = target?.closest<HTMLElement>(".spotlight");
      if (!el) return;
      const rect = el.getBoundingClientRect();
      pending = { el, x: event.clientX - rect.left, y: event.clientY - rect.top };
      if (!frame) frame = requestAnimationFrame(flush);
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
