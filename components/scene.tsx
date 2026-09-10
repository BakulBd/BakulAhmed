"use client";

import { useEffect, useRef } from "react";

/**
 * The background: one scene, re-lit by [data-mood].
 *
 * Four stacked layers, all painted from mood variables so a mood change is a
 * colour grade rather than a swap — sky, horizon glow, a skyline silhouette,
 * and a fine grain. No images, so it costs nothing to download.
 */
export default function Scene() {
  const ref = useRef<HTMLDivElement>(null);

  // Slow parallax: the sky barely moves, the foreground moves most. Skipped
  // when motion is reduced or the pointer is coarse (phones pay for this).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        el.style.setProperty("--p1", `${y * 0.02}px`);
        el.style.setProperty("--p2", `${y * 0.06}px`);
        el.style.setProperty("--p3", `${y * 0.12}px`);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="scene">
      <div className="scene__sky" />
      {/* Grain sits directly over the sky, which is the only thing that bands.
          Above the clouds its blend mode would force everything beneath it to
          re-composite each frame — measured at 25 FPS on a desktop. */}
      <div className="scene__grain" />
      <div className="scene__celestial" />
      <div className="scene__glow" />
      <div className="scene__clouds" />
      <div className="scene__clouds scene__clouds--low" />
      <div className="scene__ridge scene__ridge--far" />
      <div className="scene__ridge scene__ridge--near" />
      <div className="scene__windows" />
    </div>
  );
}
