"use client";

import { useEffect, useRef } from "react";

/** One full set of scene layers, painted for a single mood. */
function Layers() {
  return (
    <>
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
    </>
  );
}

/**
 * The background: one scene, re-lit by [data-mood].
 *
 * The layers read animated custom properties, so a mood change grades them in
 * place. Cross-fading two complete sets was tried and measured worse — it
 * rasterises twice the gradient area — so the cost is kept down instead by
 * making the expensive layers small: the sun is a compact element that moves,
 * not a full-viewport gradient whose centre is animated.
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
      <Layers />
    </div>
  );
}
