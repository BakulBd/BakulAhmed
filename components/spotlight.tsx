"use client";

import { useEffect } from "react";

/** Degrees a `.tilt` card leans towards the pointer at its very edge. */
const TILT = 4;

/**
 * Mounted once. Tracks the pointer over any `.spotlight` element and writes
 * its local coordinates as CSS custom properties, so the cards themselves stay
 * server-rendered and ship no JavaScript.
 *
 * The same listener leans `.tilt` cards towards the pointer — a few degrees,
 * written as --tilt and applied in CSS, and reset the moment the pointer
 * moves on.
 */
export default function Spotlight() {
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let pending: { el: HTMLElement | null; tilt: HTMLElement | null; x: number; y: number } | null = null;
    let tilted: HTMLElement | null = null;

    const untilt = () => {
      if (!tilted) return;
      tilted.style.removeProperty("--tilt");
      tilted = null;
    };

    const flush = () => {
      frame = 0;
      if (!pending) return;
      const { el, tilt, x, y } = pending;
      pending = null;
      if (el) {
        const rect = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${x - rect.left}px`);
        el.style.setProperty("--my", `${y - rect.top}px`);
      }
      if (tilt !== tilted) untilt();
      if (tilt) {
        const rect = tilt.getBoundingClientRect();
        const nx = (x - rect.left) / rect.width - 0.5;
        const ny = (y - rect.top) / rect.height - 0.5;
        // rotateX(-ny) then rotateY(nx), as one axis-angle for the `rotate`
        // property: it composes with `transform`, which the scroll reveal
        // holds, so the two never fight over the same property.
        const mag = Math.hypot(nx, ny);
        tilt.style.setProperty(
          "--tilt",
          mag < 0.001
            ? "0 0 1 0deg"
            : `${(-ny / mag).toFixed(3)} ${(nx / mag).toFixed(3)} 0 ${(mag * TILT * 2).toFixed(2)}deg`,
        );
        tilted = tilt;
      }
    };

    const onMove = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      pending = {
        el: target?.closest<HTMLElement>(".spotlight") ?? null,
        tilt: target?.closest<HTMLElement>(".tilt") ?? null,
        x: event.clientX,
        y: event.clientY,
      };
      if (!frame) frame = requestAnimationFrame(flush);
    };

    const onLeave = () => {
      pending = null;
      untilt();
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
      untilt();
    };
  }, []);

  return null;
}
