"use client";

import { useEffect, useRef } from "react";
import { sky } from "@/lib/mood";

/**
 * Tonight's moon. The head script renders it into this canvas before React
 * hydrates (lib/mood.ts) and records the canvas it drew into. A canvas it
 * never saw — one React created after a hot reload, or a remount — is
 * rendered here instead, so the moon can never come back blank. On a normal
 * page load this does nothing: the script already drew into this element.
 */
export default function MoonCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const core = sky();
    if (!canvas || !core) return;
    const drawn = (window.__moonDrawn ??= new WeakSet<HTMLCanvasElement>());
    if (drawn.has(canvas)) return;
    // Still loading: React has hydrated before DOMContentLoaded, and the head
    // script is about to render into this very element. Rendering here too
    // drew the moon twice on a slow phone — 230ms of blocked main thread on
    // the home page, measured.
    if (document.readyState === "loading") return;
    core.drawMoon(canvas, new Date());
    drawn.add(canvas);
  }, []);
  // The size must match what the renderer expects.
  return <canvas ref={ref} className="scene__moon" width={224} height={224} />;
}
