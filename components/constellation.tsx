"use client";

import { useEffect, useRef, useState } from "react";
import { MASTS, NEAR_TILE } from "@/lib/skyline-masts";

/**
 * Everything alive in the sky, on ONE canvas and ONE requestAnimationFrame:
 *
 *   - a still field of background stars that twinkle, in three temperatures
 *   - the drifting constellation, its stars linked when they pass close
 *   - shooting stars, now and then, on a dark enough night
 *   - fireflies among the buildings, flashing the way real ones do
 *   - birds crossing in loose V's by day
 *   - whatever the season drops: snow, leaves, petals, or summer motes rising
 *   - red aviation lights on the city's masts, blinking out of step
 *
 * Each fades with its own variable (--stars, --fireflies, --birds, --fall), so
 * the mood transition brings them in and out in the order it happens outside.
 *
 * Resolution: the canvas is backed at the device pixel ratio (capped at 2),
 * and every glow is a sprite pre-rendered at that ratio and drawn 1:1 — so a
 * firefly is a sharp, bright core in a soft halo on any screen, where the old
 * shadowBlur dots smeared on high-density displays and cost a blur per dot.
 *
 * Motion is scaled by real elapsed time, not frames, so a 120Hz phone does not
 * run the sky at double speed. Paused while the tab is hidden. Under reduced
 * motion it paints one still frame of the stars and redraws only when the sky
 * changes.
 *
 * Adaptive: if the page cannot hold its frame rate with the sky running, the
 * sky drops to every other frame and the rest of the page keeps the budget.
 * Particles this slow look the same at 30fps; a stuttering scroll does not.
 * On a 6x-throttled phone the canvas took the main thread from 42% to 102%
 * busy; halving it leaves the scroll at a full 60.
 */

type Sprite = HTMLCanvasElement;

const FIREFLY_CORE = "#fffbe2";
const FIREFLY = "214, 244, 110";
/** Real stars are not all white: a few run blue, a few warm. */
const STAR_TINTS = ["#ffffff", "#d6e4ff", "#fff0d8"];

/** A radial glow pre-rendered at device resolution. `stops` take [offset, alpha]. */
function glow(size: number, dpr: number, colour: string, stops: [number, number][]): Sprite {
  const c = document.createElement("canvas");
  const px = Math.max(2, Math.ceil(size * dpr));
  c.width = c.height = px;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2);
  for (const [o, a] of stops) grad.addColorStop(o, `rgba(255,255,255,${a})`);
  g.fillStyle = grad;
  g.fillRect(0, 0, px, px);
  // Tint: keep the alpha falloff, take the colour — works for any CSS colour
  // string the canvas accepts (the sampled ones are often oklch()).
  g.globalCompositeOperation = "source-in";
  g.fillStyle = colour;
  g.fillRect(0, 0, px, px);
  return c;
}

/** A bright star: a tight core with faint diffraction spikes. */
function glint(size: number, dpr: number, colour: string): Sprite {
  const c = glow(size, dpr, colour, [
    [0, 1],
    [0.08, 0.9],
    [0.22, 0.28],
    [1, 0],
  ]);
  const g = c.getContext("2d")!;
  const px = c.width;
  g.globalCompositeOperation = "lighter";
  for (const horizontal of [true, false]) {
    const grad = horizontal
      ? g.createLinearGradient(0, 0, px, 0)
      : g.createLinearGradient(0, 0, 0, px);
    grad.addColorStop(0, "rgba(255,255,255,0)");
    grad.addColorStop(0.5, "rgba(255,255,255,0.55)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    const t = Math.max(1, dpr * 0.6);
    if (horizontal) g.fillRect(0, px / 2 - t / 2, px, t);
    else g.fillRect(px / 2 - t / 2, 0, t, px);
  }
  return c;
}

export default function Constellation() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    // Holds the scroll parallax (--p3) the skyline moves by; read as an inline
    // style, which costs no style recalculation inside the frame loop.
    const scene = document.querySelector<HTMLElement>(".scene");
    // Phones get a lighter sky: fewer particles, same look.
    const density = coarse ? 0.7 : 1;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    let raf = 0;
    let running = true;
    let last = performance.now();

    /* ---------------- particles ---------------- */

    type Star = { x: number; y: number; r: number; tint: number; rate: number; phase: number; bright: boolean };
    type Dot = { x: number; y: number; vx: number; vy: number; r: number; phase: number };
    type Fly = {
      x: number; y: number; heading: number; turn: number; speed: number;
      z: number; period: number; offset: number; double: boolean; bob: number;
    };
    type Faller = {
      x: number; y: number; z: number; speed: number; sway: number; phase: number;
      spin: number; angle: number; flip: number; flipRate: number; alt: boolean; t: number;
    };
    type Bird = { x: number; y: number; flap: number; rate: number; size: number };
    type Flock = { birds: Bird[]; dir: number; speed: number };
    type Meteor = { x: number; y: number; vx: number; vy: number; life: number; age: number; len: number };

    let stars: Star[] = [];
    let dots: Dot[] = [];
    let flies: Fly[] = [];
    let fallers: Faller[] = [];
    let flock: Flock | null = null;
    let meteor: Meteor | null = null;
    let nextFlock = 6 + Math.random() * 10;
    let nextMeteor = 3 + Math.random() * 6;

    /*
     * Where the sky ends. The canvas sits in front of the whole scene, so
     * anything drawn below the landscape's highest point lands ON the city:
     * stars and the drifting constellation used to scatter across rooftops
     * and hillsides. The highest points, measured from the generated shapes:
     * the hills peak 21.1vh up (scene__hills: 62% of 44vh, path top 54/240),
     * the far city's tallest mast 6vh + 122px; a few pixels' margin above.
     */
    let horizon = 0;
    /* The near skyline: fireflies live among it, from its rooftops (its
       tallest mast is 166px up) down to the street. */
    const STREET = 6;
    const ROOFS = 172;

    const seed = () => {
      const area = width * height;
      horizon = height - Math.max(height * 0.211, height * 0.06 + 122) - 8;
      // The Milky Way's line across the sky — the same one .scene__galaxy
      // draws (centred 47.8vw, 30.8vh, turned 27deg), so a share of the stars
      // gather along it and the band is resolved, not just a glow.
      const tilt = (27 * Math.PI) / 180;
      const bandX = width * 0.478;
      const bandY = height * 0.308;
      const reach = Math.hypot(width, height) * 0.6;
      const spread = Math.max(width, height) * 0.05;
      const onBand = () => {
        for (let tries = 0; tries < 6; tries++) {
          const along = (Math.random() * 2 - 1) * reach;
          // Roughly normal across the band: dense along its spine.
          const across = (Math.random() + Math.random() + Math.random() - 1.5) * spread;
          const x = bandX + along * Math.cos(tilt) + across * Math.sin(tilt);
          const y = bandY - along * Math.sin(tilt) + across * Math.cos(tilt);
          if (x > 0 && x < width && y > 0 && y < horizon) return { x, y };
        }
        return null;
      };
      stars = Array.from({ length: Math.round(Math.min(260, area / 6000) * density) }, () => {
        // Denser towards the top of the sky, the way the eye reads depth.
        const banded = Math.random() < 0.32 ? onBand() : null;
        const y = banded?.y ?? Math.pow(Math.random(), 1.6) * horizon;
        return {
          x: banded?.x ?? Math.random() * width,
          y,
          r: 0.35 + Math.random() * 0.75,
          tint: Math.random() < 0.7 ? 0 : Math.random() < 0.6 ? 1 : 2,
          rate: 0.4 + Math.random() * 1.6,
          phase: Math.random() * Math.PI * 2,
          bright: Math.random() < 0.06,
        };
      });

      dots = Array.from({ length: Math.round(Math.min(64, area / 28000) * density) }, () => ({
        x: Math.random() * width,
        y: Math.random() * horizon,
        vx: (Math.random() - 0.5) * 0.14,
        vy: (Math.random() - 0.5) * 0.14,
        r: Math.random() * 1.1 + 0.6,
        phase: Math.random() * Math.PI * 2,
      }));

      // Fireflies live among the buildings — down by the street, between the
      // blocks, up to the rooftops — never out in the open sky, where they
      // used to drift at half the screen's height and read as stars.
      flies = Array.from({ length: Math.round(Math.min(32, width / 48) * density) }, () => {
        const z = 0.55 + Math.random() * 0.95;
        return {
          x: Math.random() * width,
          // Weighted towards the street, where real ones keep to the grass.
          y: height - STREET - Math.pow(Math.random(), 1.5) * (ROOFS - STREET),
          heading: Math.random() * Math.PI * 2,
          turn: 0,
          speed: (0.12 + Math.random() * 0.2) * z,
          z,
          // Real fireflies flash on a species rhythm: a short bright pulse,
          // then seconds of dark. Some species double-flash.
          period: 1.9 + Math.random() * 2.6,
          offset: Math.random() * 10,
          double: Math.random() < 0.3,
          bob: Math.random() * Math.PI * 2,
        };
      });

      const fallCount = Math.round(Math.min(64, width / 22) * density);
      fallers = Array.from({ length: fallCount }, (_, i) => {
        // Depth: near ones are bigger, faster and brighter — that alone makes
        // snow read as falling through space rather than across a screen.
        const z = 0.45 + Math.random() * 1.05;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          z,
          speed: (0.22 + Math.random() * 0.3) * z,
          sway: 6 + Math.random() * 22,
          phase: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.05,
          angle: Math.random() * Math.PI * 2,
          flip: Math.random() * Math.PI * 2,
          flipRate: 0.02 + Math.random() * 0.05,
          alt: Math.random() < 0.38,
          // Evenly spread cut-off: a particle joins once --fall passes it, so
          // density follows the season and eases in over the transition.
          t: (i + 0.5) / fallCount,
        };
      });
    };

    /* ---------------- paint, sampled from CSS ---------------- */

    let paint = {
      particle: "#b5e3d7",
      stars: 1,
      fireflies: 1,
      birds: 0,
      bird: "#1b2b3a",
      fall: 0,
      fallColour: "#eef5ff",
      fallColour2: "#eef5ff",
      season: "winter",
      windows: 0,
    };
    let sprites = {
      star: [] as Sprite[],
      glint: [] as Sprite[],
      dot: null as Sprite | null,
      fly: null as Sprite | null,
      bloom: null as Sprite | null,
      snow: null as Sprite | null,
      snow2: null as Sprite | null,
      head: null as Sprite | null,
      beacon: null as Sprite | null,
    };
    let spriteKey = "";
    // The season's firefly density, eased towards here rather than animated
    // in CSS (see --firefly-season): a fifth of the way per sample, so a
    // season change thins or thickens them over about a second.
    let fireflySeason = -1;

    const buildSprites = () => {
      const key = `${paint.particle}|${paint.fallColour}|${paint.fallColour2}`;
      if (key === spriteKey) return;
      spriteKey = key;
      sprites = {
        star: STAR_TINTS.map((t) => glow(6, dpr, t, [[0, 1], [0.25, 0.8], [0.6, 0.18], [1, 0]])),
        glint: STAR_TINTS.map((t) => glint(16, dpr, t)),
        dot: glow(8, dpr, paint.particle, [[0, 1], [0.3, 0.75], [0.7, 0.12], [1, 0]]),
        fly: (() => {
          // Warm white core, lime-gold body, wide faint halo.
          const c = document.createElement("canvas");
          const px = Math.ceil(30 * dpr);
          c.width = c.height = px;
          const g = c.getContext("2d")!;
          const grad = g.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2);
          grad.addColorStop(0, FIREFLY_CORE);
          grad.addColorStop(0.07, `rgba(${FIREFLY}, 1)`);
          grad.addColorStop(0.2, `rgba(${FIREFLY}, 0.5)`);
          grad.addColorStop(0.45, `rgba(${FIREFLY}, 0.14)`);
          grad.addColorStop(1, `rgba(${FIREFLY}, 0)`);
          g.fillStyle = grad;
          g.fillRect(0, 0, px, px);
          return c;
        })(),
        // The light a flash throws into the air around it: wide and faint,
        // drawn only while the firefly is lit.
        bloom: glow(96, dpr, `rgb(${FIREFLY})`, [[0, 0.55], [0.18, 0.3], [0.5, 0.08], [1, 0]]),
        snow: glow(8, dpr, paint.fallColour, [[0, 1], [0.4, 0.9], [0.75, 0.3], [1, 0]]),
        snow2: glow(8, dpr, paint.fallColour2, [[0, 1], [0.4, 0.9], [0.75, 0.3], [1, 0]]),
        head: glow(10, dpr, "#ffffff", [[0, 1], [0.3, 0.6], [1, 0]]),
        beacon: glow(14, dpr, "#ff4f45", [[0, 1], [0.14, 0.95], [0.35, 0.28], [1, 0]]),
      };
    };

    const samplePaint = () => {
      const root = document.documentElement;
      const cs = getComputedStyle(root);
      const num = (name: string) => Number(cs.getPropertyValue(name)) || 0;
      const str = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
      const season = num("--firefly-season");
      fireflySeason = fireflySeason < 0 || still ? season : fireflySeason + (season - fireflySeason) * 0.2;
      paint = {
        particle: str("--particle", "#b5e3d7"),
        // Follows --stars, which the mood transition eases in last, so the
        // stars come out gradually rather than appearing all at once.
        stars: num("--stars"),
        // The hour's fireflies, thinned by the time of year: none in winter.
        fireflies: num("--fireflies") * fireflySeason,
        birds: num("--birds"),
        bird: str("--bird-color", "#1b2b3a"),
        fall: num("--fall"),
        fallColour: str("--fall-color", "#eef5ff"),
        fallColour2: str("--fall-color-2", "#eef5ff"),
        season: root.getAttribute("data-season") ?? "winter",
        windows: num("--windows"),
      };
      buildSprites();
    };

    /* ---------------- drawing ---------------- */

    const draw = (now: number, dt: number) => {
      const t = now / 1000;
      ctx.clearRect(0, 0, width, height);
      const { stars: night, fireflies, birds, fall } = paint;
      // The near skyline's scroll parallax, so what lives among the buildings
      // moves with them. An inline style: reading it costs no style recalc.
      const lift = parseFloat(scene?.style.getPropertyValue("--p3") || "0") || 0;
      // Stars dim towards the horizon, through the thicker, hazier air low
      // over a city — the band just above the rooftops holds the faintest.
      const low = height * 0.16;

      // --- background stars: still, twinkling ---
      if (night > 0.01) {
        for (const s of stars) {
          const tw = 0.55 + 0.45 * Math.sin(t * s.rate + s.phase);
          const air = 0.3 + 0.7 * Math.min(1, (horizon - s.y) / low);
          ctx.globalAlpha = night * (s.bright ? 0.9 : 0.5) * tw * air;
          const sprite = s.bright ? sprites.glint[s.tint] : sprites.star[s.tint];
          const size = s.bright ? 12 + s.r * 4 : 3 + s.r * 3;
          ctx.drawImage(sprite, s.x - size / 2, s.y - size / 2, size, size);
        }
      }

      // --- the constellation: drifting, linked when close ---
      if (night > 0.01) {
        for (const d of dots) {
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          if (d.x < 0 || d.x > width) d.vx *= -1;
          if (d.y < 0 || d.y > horizon) d.vy *= -1;
        }
        ctx.strokeStyle = paint.particle;
        ctx.lineWidth = 0.7;
        for (let i = 0; i < dots.length; i++) {
          for (let j = i + 1; j < dots.length; j++) {
            const dx = dots[i].x - dots[j].x;
            const dy = dots[i].y - dots[j].y;
            const dist2 = dx * dx + dy * dy;
            if (dist2 > 16900) continue;
            ctx.globalAlpha = (1 - Math.sqrt(dist2) / 130) * 0.16 * night;
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
          }
        }
        if (sprites.dot) {
          for (const d of dots) {
            ctx.globalAlpha = night * (0.38 + 0.14 * Math.sin(t * 0.8 + d.phase));
            const size = 4 + d.r * 4;
            ctx.drawImage(sprites.dot, d.x - size / 2, d.y - size / 2, size, size);
          }
        }
      }

      // --- a shooting star, now and then, on a dark enough night ---
      if (night > 0.5 && !still) {
        nextMeteor -= dt / 60;
        if (!meteor && nextMeteor <= 0) {
          const angle = (Math.random() < 0.5 ? 1 : -1) * (0.35 + Math.random() * 0.3);
          const speed = 9 + Math.random() * 6;
          meteor = {
            x: width * (0.15 + Math.random() * 0.7),
            y: height * Math.random() * 0.3,
            vx: Math.sin(angle) * speed,
            vy: Math.cos(angle) * speed * 0.45,
            life: 40 + Math.random() * 25,
            age: 0,
            len: 90 + Math.random() * 70,
          };
          nextMeteor = 5 + Math.random() * 9;
        }
      }
      if (meteor) {
        const m = meteor;
        m.age += dt;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        const p = m.age / m.life;
        // Burns out in the sky: one that would have fallen into the city
        // fades over its last 60px above the rooftops instead.
        if (p >= 1 || m.y >= horizon) meteor = null;
        else {
          // Brightens, then burns out; the tail grows as it gathers speed.
          const a = Math.sin(Math.PI * p) * night * Math.min(1, (horizon - m.y) / 60);
          const v = Math.hypot(m.vx, m.vy);
          const tail = m.len * Math.min(1, p * 2.2);
          const tx = m.x - (m.vx / v) * tail;
          const ty = m.y - (m.vy / v) * tail;
          const grad = ctx.createLinearGradient(m.x, m.y, tx, ty);
          grad.addColorStop(0, "rgba(255,255,255,0.95)");
          grad.addColorStop(0.25, "rgba(220,235,255,0.35)");
          grad.addColorStop(1, "rgba(220,235,255,0)");
          ctx.globalAlpha = a;
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.3;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(tx, ty);
          ctx.stroke();
          if (sprites.head) ctx.drawImage(sprites.head, m.x - 5, m.y - 5, 10, 10);
        }
      }

      // --- birds, crossing by day in a loose V ---
      if (birds > 0.05 && !still) {
        nextFlock -= dt / 60;
        if (!flock && nextFlock <= 0) {
          const dir = Math.random() < 0.5 ? 1 : -1;
          const n = 3 + Math.floor(Math.random() * 5);
          const y0 = height * (0.06 + Math.random() * 0.3);
          const x0 = dir > 0 ? -60 : width + 60;
          flock = {
            dir,
            speed: 0.75 + Math.random() * 0.45,
            birds: Array.from({ length: n }, (_, i) => {
              const rank = Math.ceil(i / 2);
              const side = i % 2 ? 1 : -1;
              return {
                x: x0 - dir * rank * (16 + Math.random() * 6),
                y: y0 + side * rank * (9 + Math.random() * 5),
                flap: Math.random() * Math.PI * 2,
                rate: 0.16 + Math.random() * 0.06,
                size: 4.2 + Math.random() * 2,
              };
            }),
          };
          nextFlock = 16 + Math.random() * 22;
        }
      }
      if (flock) {
        ctx.globalAlpha = Math.min(1, birds) * 0.7;
        ctx.strokeStyle = paint.bird;
        ctx.lineWidth = 1.25;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        let out = true;
        for (const b of flock.birds) {
          b.x += flock.dir * flock.speed * dt;
          b.y += Math.sin(t * 0.7 + b.flap) * 0.06 * dt;
          b.flap += b.rate * dt;
          if (flock.dir > 0 ? b.x < width + 40 : b.x > -40) out = false;
          // Wings: two arcs whose tips rise and fall with the beat.
          const lift = Math.sin(b.flap);
          const s = b.size;
          ctx.beginPath();
          ctx.moveTo(b.x - s, b.y - lift * s * 0.55);
          ctx.quadraticCurveTo(b.x - s * 0.45, b.y - s * 0.35 - lift * s * 0.2, b.x, b.y);
          ctx.quadraticCurveTo(b.x + s * 0.45, b.y - s * 0.35 - lift * s * 0.2, b.x + s, b.y - lift * s * 0.55);
          ctx.stroke();
        }
        if (out) flock = null;
      }

      // --- what the season is dropping ---
      if (fall > 0.01) {
        const season = paint.season;
        const winged = season === "autumn" || season === "spring";
        const rising = season === "summer";
        const drop = rising ? -0.4 : winged ? 0.7 : 1;
        const swayScale = winged ? 1.9 : rising ? 1.4 : 1;
        for (const d of fallers) {
          // Fade in over the last eighth of the threshold so a season change
          // thickens the air rather than popping particles into existence.
          const a = fall - d.t;
          if (a <= 0) continue;
          const alpha = Math.min(1, a * 8) * (0.42 + 0.34 * Math.min(1, d.z));
          if (!still) {
            d.y += d.speed * drop * dt;
            d.x += Math.sin(t * 0.6 + d.phase) * (d.sway / 90) * swayScale * dt;
            d.angle += d.spin * dt;
            d.flip += d.flipRate * dt;
          }
          if (d.y > height + 10 || d.y < -10) {
            d.y = rising ? height + 10 : -10;
            d.x = Math.random() * width;
          }
          if (d.x < -14) d.x = width + 14;
          if (d.x > width + 14) d.x = -14;

          ctx.globalAlpha = alpha;
          if (winged) {
            // A leaf or petal, tumbling: turned by its spin, and squashed by
            // the cosine of its flip so it reads as turning over in the air.
            const L = (season === "autumn" ? 3.4 : 2.6) * d.z + 1.2;
            const W = L * (season === "autumn" ? 0.48 : 0.72);
            ctx.save();
            ctx.translate(d.x, d.y);
            ctx.rotate(d.angle);
            ctx.scale(1, 0.25 + 0.75 * Math.abs(Math.cos(d.flip)));
            ctx.fillStyle = d.alt ? paint.fallColour2 : paint.fallColour;
            ctx.beginPath();
            ctx.moveTo(-L, 0);
            ctx.quadraticCurveTo(0, -W * 1.5, L, 0);
            ctx.quadraticCurveTo(0, W * 1.5, -L, 0);
            ctx.fill();
            ctx.restore();
          } else {
            const sprite = d.alt ? sprites.snow2 : sprites.snow;
            if (!sprite) continue;
            const size = (rising ? 2.6 : 3.4) * d.z + 1.6;
            ctx.drawImage(sprite, d.x - size / 2, d.y - size / 2, size, size);
          }
        }
      }

      // --- aviation lights on the masts ---
      // The near skyline's tile is centred on the viewport and repeats every
      // NEAR_TILE.w, anchored to the bottom and moved by the same scroll
      // parallax (--p3) as the skyline itself, so each light sits on its mast.
      // Two sets, on different rhythms, as unrelated towers are.
      const beacons = Math.min(1, Math.max(0, (paint.windows - 0.2) * 2));
      if (beacons > 0.01 && sprites.beacon) {
        const lift = parseFloat(scene?.style.getPropertyValue("--p3") || "0") || 0;
        const first = width / 2 - NEAR_TILE.w / 2;
        const start = first - Math.ceil(first / NEAR_TILE.w) * NEAR_TILE.w;
        const top = height - NEAR_TILE.h + lift;
        for (let left = start; left < width; left += NEAR_TILE.w) {
          MASTS.forEach(([mx, my], i) => {
            const x = left + mx;
            const y = top + my;
            if (x < -8 || x > width + 8 || y > height + 8) return;
            const period = i % 2 ? 3.3 : 2.8;
            const p = ((t + (i % 2 ? 1.5 : 0)) / period) % 1;
            const on = p < 0.08 ? p / 0.08 : p < 0.16 ? 1 : p < 0.3 ? 1 - (p - 0.16) / 0.14 : 0;
            ctx.globalAlpha = beacons * (still ? 0.85 : 0.2 + 0.8 * on);
            ctx.drawImage(sprites.beacon!, x - 7, y - 7, 14, 14);
          });
        }
      }

      // --- fireflies, among the buildings ---
      if (fireflies > 0.01 && sprites.fly) {
        const top = height - ROOFS;
        const street = height - STREET;
        // Light adds to light: two flashes crossing brighten each other, as
        // they do to the eye, rather than one painting over the other.
        ctx.globalCompositeOperation = "lighter";
        for (const f of flies) {
          // Flash: a smooth pulse at the start of each period, dark after.
          const p = ((t + f.offset) / f.period) % 1;
          let flash = p < 0.24 ? Math.sin((Math.PI * p) / 0.24) : 0;
          if (f.double && p > 0.32 && p < 0.48) flash = Math.max(flash, 0.8 * Math.sin((Math.PI * (p - 0.32)) / 0.16));
          if (!still) {
            // A smoothed random walk: nudge the turn rate, not the position,
            // so the path curves the way an insect's does.
            f.turn = f.turn * 0.94 + (Math.random() - 0.5) * 0.05;
            f.heading += f.turn * dt;
            f.bob += 0.03 * dt;
            f.x += Math.cos(f.heading) * f.speed * dt;
            f.y += (Math.sin(f.heading) * f.speed * 0.55 + Math.sin(f.bob) * 0.08) * dt;
            // The J: a firefly swoops upward while it flashes and sinks back
            // while dark, so each flash is drawn as a short rising stroke.
            f.y += (flash > 0 ? -flash * 0.3 * f.z : 0.045) * dt;
            if (f.x < -12) f.x = width + 12;
            if (f.x > width + 12) f.x = -12;
            // Kept among the buildings: turned back down at the rooftops and
            // back up at the street.
            if (f.y < top) f.heading = Math.abs(f.heading) % Math.PI;
            if (f.y > street) f.heading = -Math.abs(f.heading) % Math.PI;
            f.y = Math.min(street + 4, Math.max(top - 10, f.y));
          }
          const y = f.y + lift;
          // Between flashes a firefly still glows faintly — enough to follow
          // it between the blocks, the way the eye does on a summer night.
          const level = still ? 0.7 : 0.2 + 0.8 * flash;
          const near = Math.min(1, 0.55 + f.z * 0.4);
          if (flash > 0.05 && sprites.bloom) {
            ctx.globalAlpha = flash * fireflies * near * 0.24;
            const bloom = 46 + f.z * 34;
            ctx.drawImage(sprites.bloom, f.x - bloom / 2, y - bloom / 2, bloom, bloom);
          }
          ctx.globalAlpha = level * fireflies * near;
          const size = 16 + f.z * 15;
          ctx.drawImage(sprites.fly, f.x - size / 2, y - size / 2, size, size);
        }
        ctx.globalCompositeOperation = "source-over";
      }

      ctx.globalAlpha = 1;
    };

    /* ---------------- loop & lifecycle ---------------- */

    let sinceSample = 1e9;
    const SAMPLE_EVERY = 12;

    // Frame-budget watch: the mean interval between animation frames over a
    // window of them. Past 18ms (under ~55fps) the sky halves its rate, once.
    let halfRate = false;
    let parity = 0;
    let lastTick = performance.now();
    let windowTotal = 0;
    let windowFrames = 0;
    let windowsSeen = 0;

    const frame = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      if (!halfRate) {
        windowTotal += now - lastTick;
        // The first window after load is noisy (fonts, hydration); skip it.
        if (++windowFrames === 90) {
          if (windowsSeen++ > 0 && windowTotal / windowFrames > 18) halfRate = true;
          windowTotal = 0;
          windowFrames = 0;
        }
      }
      lastTick = now;
      if (halfRate && (parity ^= 1)) return;
      // Elapsed time in 60fps frames, clamped so a stalled tab resumes calmly.
      const dt = Math.min(3, (now - last) / 16.667);
      last = now;
      if (++sinceSample >= SAMPLE_EVERY) {
        sinceSample = 0;
        samplePaint();
      }
      draw(now, dt);
    };

    let seededW = 0;
    let seededH = 0;
    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // A phone's address bar showing and hiding fires resize constantly;
      // re-seeding then made the whole sky jump. Only a real change re-seeds.
      if (Math.abs(width - seededW) > 40 || Math.abs(height - seededH) > 160) {
        seededW = width;
        seededH = height;
        seed();
      }
      if (still) {
        samplePaint();
        draw(performance.now(), 0);
      }
    };

    resize();

    if (still) {
      // One still frame, repainted only when the sky itself changes.
      const observer = new MutationObserver(() => {
        samplePaint();
        draw(performance.now(), 0);
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mood", "data-season"] });
      window.addEventListener("resize", resize);
      return () => {
        observer.disconnect();
        window.removeEventListener("resize", resize);
      };
    }

    const onVisibility = () => {
      running = !document.hidden;
      cancelAnimationFrame(raf);
      if (running) {
        last = lastTick = performance.now();
        windowTotal = 0;
        windowFrames = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [mounted]);

  if (!mounted) return null;
  return <canvas ref={ref} aria-hidden="true" className="constellation" />;
}
