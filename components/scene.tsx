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
      {/* The Milky Way, behind the moon: a dark night's band of starlight. */}
      <div className="scene__galaxy" />
      <div className="scene__celestial">
        {/* Tonight's moon, rendered into this canvas by the head script
            (window.__sky.drawMoon) before hydration. React leaves its pixels
            alone; the size here must match what the renderer expects. */}
        <canvas className="scene__moon" width={224} height={224} />
      </div>
      <div className="scene__glow" />
      <div className="scene__cirrus" />
      <div className="scene__clouds" />
      <div className="scene__clouds scene__clouds--low" />
      {/* The sun burning through whatever cloud is crossing it. */}
      <div className="scene__flare" />
      {/* Hills behind the city carry the season: green, gold, rust, snow. */}
      <div className="scene__hills" />
      {/* The city in three planes, with mist lying between the far one and
          the rest (shapes: scripts/skyline.mjs). */}
      <div className="scene__ridge scene__ridge--far" />
      <div className="scene__haze" />
      <div className="scene__ridge scene__ridge--mid" />
      {/* Its windows come on in two waves (its own ::before and ::after);
          the masts' aviation lights blink on the sky's canvas. */}
      <div className="scene__ridge scene__ridge--near" />
      {/* The rooftops catch the hour's light — and in winter, snow. */}
      <div className="scene__rim" />
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
