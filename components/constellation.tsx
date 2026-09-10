"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Three particle systems on ONE canvas — stars overhead, fireflies low down,
 * and whatever the season is dropping through the air — sharing a single
 * requestAnimationFrame so the page pays for one loop, not three. Each fades
 * with its own variable: `--stars`, `--fireflies`, `--fall`.
 *
 * Deliberately sparse and low-contrast: texture, not decoration. Skipped
 * entirely under reduced motion, and paused while the tab is hidden.
 */
export default function Constellation() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [enabled, setEnabled] = useState(false);

  // Two passes: decide whether motion is allowed, then run only if it is, so
  // no stray canvas is left in the tree for reduced-motion users.
  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let raf = 0;
    let running = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type Dot = { x: number; y: number; vx: number; vy: number; r: number };
    let dots: Dot[] = [];

    /** Fireflies wander instead of drifting, and blink on their own phase. */
    type Fly = {
      x: number;
      y: number;
      angle: number;
      speed: number;
      phase: number;
      rate: number;
      r: number;
    };
    let flies: Fly[] = [];

    /** Snow, leaves or petals: whatever the season drops through the air. */
    type Faller = {
      x: number;
      y: number;
      r: number;
      speed: number;
      sway: number;
      phase: number;
      spin: number;
      angle: number;
      t: number;
    };
    let fallers: Faller[] = [];

    /**
     * Particle colour and density follow the mood: stars come out at night.
     *
     * getComputedStyle forces a style recalculation, so this is sampled every
     * few frames rather than every one — a mood transition takes seconds, and
     * reading it 60 times a second was pure overhead.
     */
    let paint = {
      colour: "#b5e3d7",
      strength: 1,
      fireflies: 1,
      fall: 0,
      fallColour: "#eef5ff",
      season: "winter",
    };
    let sinceSample = 1e9;
    const SAMPLE_EVERY = 12;

    const samplePaint = () => {
      const cs = getComputedStyle(document.documentElement);
      paint = {
        colour: cs.getPropertyValue("--particle").trim() || "#b5e3d7",
        // Follows --stars, which the mood transition eases in last, so the
        // stars come out gradually rather than appearing all at once.
        strength: Number(cs.getPropertyValue("--stars")) || 0,
        fireflies: Number(cs.getPropertyValue("--fireflies")) || 0,
        fall: Number(cs.getPropertyValue("--fall")) || 0,
        fallColour: cs.getPropertyValue("--fall-color").trim() || "#eef5ff",
        season: document.documentElement.getAttribute("data-season") ?? "winter",
      };
    };

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Density scales with area, capped so large screens stay cheap.
      const count = Math.min(70, Math.round((width * height) / 26000));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        r: Math.random() * 1.4 + 0.6,
      }));

      // Fireflies keep to the lower third, where the skyline is.
      const flyCount = Math.min(30, Math.round(width / 52));
      flies = Array.from({ length: flyCount }, () => ({
        x: Math.random() * width,
        y: height * (0.6 + Math.random() * 0.38),
        angle: Math.random() * Math.PI * 2,
        speed: 0.12 + Math.random() * 0.22,
        phase: Math.random() * Math.PI * 2,
        rate: 0.6 + Math.random() * 0.9,
        r: 1.1 + Math.random() * 1.3,
      }));

      // Density scales with width so a phone draws a handful, not a blizzard.
      const fallCount = Math.min(46, Math.round(width / 26));
      fallers = Array.from({ length: fallCount }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 1 + Math.random() * 2.2,
        speed: 0.25 + Math.random() * 0.55,
        sway: 6 + Math.random() * 22,
        phase: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.05,
        angle: Math.random() * Math.PI * 2,
        // Evenly spread cut-off: a particle joins once --fall passes it, so
        // density follows the season and eases in over the transition.
        t: (i + 0.5) / fallCount,
      }));
    };

    const draw = () => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      if (++sinceSample >= SAMPLE_EVERY) {
        sinceSample = 0;
        samplePaint();
      }
      const { colour, strength, fireflies } = paint;
      const now = performance.now() / 1000;

      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > width) d.vx *= -1;
        if (d.y < 0 || d.y > height) d.vy *= -1;
      }

      ctx.strokeStyle = colour;
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist > 130) continue;
          ctx.globalAlpha = (1 - dist / 130) * 0.13 * strength;
          ctx.beginPath();
          ctx.moveTo(dots[i].x, dots[i].y);
          ctx.lineTo(dots[j].x, dots[j].y);
          ctx.stroke();
        }
      }

      ctx.fillStyle = colour;
      for (const d of dots) {
        ctx.globalAlpha = 0.32 * strength;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- what the season is dropping ---
      if (paint.fall > 0.01) {
        ctx.save();
        ctx.fillStyle = paint.fallColour;
        // Leaves and petals are winged: they turn, sway wide and fall slowly.
        // Snow just drifts. Summer inverts the whole thing — heat coming off
        // the rooftops rises instead of falling.
        const winged = paint.season === "autumn" || paint.season === "spring";
        const rising = paint.season === "summer";
        const drop = rising ? -0.42 : winged ? 0.72 : 1;
        const swayScale = winged ? 1.9 : rising ? 1.5 : 1;
        for (const d of fallers) {
          // Fade in over the last eighth of the threshold so a season change
          // thickens the air rather than popping particles into existence.
          const a = paint.fall - d.t;
          if (a <= 0) continue;
          ctx.globalAlpha = Math.min(1, a * 8) * 0.72;

          d.y += d.speed * drop;
          d.x += Math.sin(now * 0.6 + d.phase) * (d.sway / 90) * swayScale;
          if (d.y > height + 8 || d.y < -8) {
            d.y = rising ? height + 8 : -8;
            d.x = Math.random() * width;
          }
          if (d.x < -12) d.x = width + 12;
          if (d.x > width + 12) d.x = -12;

          if (winged) {
            d.angle += d.spin;
            ctx.save();
            ctx.translate(d.x, d.y);
            ctx.rotate(d.angle);
            ctx.beginPath();
            ctx.ellipse(0, 0, d.r * 1.9, d.r * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          } else {
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // --- fireflies ---
      if (fireflies > 0.01) {
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#ffd98a";
        ctx.fillStyle = "#ffe6a3";
        for (const f of flies) {
          // A slow random walk: nudge the heading rather than the position, so
          // the path curves the way an insect's does.
          f.angle += (Math.random() - 0.5) * 0.35;
          f.x += Math.cos(f.angle) * f.speed;
          f.y += Math.sin(f.angle) * f.speed * 0.6;
          if (f.x < -10) f.x = width + 10;
          if (f.x > width + 10) f.x = -10;
          const floor = height * 0.55;
          if (f.y < floor) f.y = floor;
          if (f.y > height + 10) f.y = height;

          // Blink: dark most of the cycle, briefly bright. The exponent sets
          // the duty cycle — squaring made them too sparse to read.
          const pulse = Math.max(0, Math.sin(now * f.rate + f.phase));
          ctx.globalAlpha = Math.pow(pulse, 1.4) * 0.9 * fireflies;
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      running = !document.hidden;
      if (running) raf = requestAnimationFrame(draw);
      else cancelAnimationFrame(raf);
    };

    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled]);

  if (!enabled) return null;
  return <canvas ref={ref} aria-hidden="true" className="constellation" />;
}
