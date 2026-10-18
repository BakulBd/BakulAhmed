"use client";

import { useEffect, useRef, useState } from "react";
import { MASTS, NEAR_TILE } from "@/lib/skyline-masts";
import { littleDipper, seasonal, type Figure } from "@/lib/sky-stars";

/**
 * Everything alive in the sky, on ONE canvas and ONE requestAnimationFrame:
 *
 *   - a still field of background stars that twinkle, in three temperatures
 *   - the drifting constellation, its stars linked when they pass close —
 *     and to the pointer, when it crosses open sky: the nearest stars reach
 *     for it and signals run along the links, a small neural net that wakes
 *     where you look (fine pointers only; never under reduced motion)
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
    // The sun or moon, so nothing in the sky is drawn across its disc.
    const celestial = document.querySelector<HTMLElement>(".scene__celestial");
    // Phones get a lighter sky: fewer particles, same look.
    // A lighter sky still where the visitor asks for less (Data Saver) or the
    // device is genuinely weak — kept narrow on purpose, so every ordinary
    // laptop and phone gets the whole sky.
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    const lowPower =
      nav.connection?.saveData === true ||
      (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) ||
      (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 2);
    const density = (coarse ? 0.7 : 1) * (lowPower ? 0.6 : 1);
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
    type Bird = {
      x: number; y: number; flap: number; rate: number; size: number;
      /** Flap-glide: beat until `until` wingbeats, then glide `glide` frames. */
      until: number; glide: number; bob: number;
    };
    type Flock = { birds: Bird[]; dir: number; speed: number };
    type Meteor = {
      x: number; y: number; vx: number; vy: number; life: number; age: number; len: number;
      /** How bright this one burns (0-1), and how thick its trail is. */
      bright: number; width: number;
      fireball: boolean;
      /** A fireball breaks up as it burns out; its fragments, once it has. */
      sparks: { x: number; y: number; vx: number; vy: number; age: number; life: number }[] | null;
    };

    let stars: Star[] = [];
    let dots: Dot[] = [];
    // The drifting net's links (key: lower index * 1000 + higher), eased 0-1.
    const links = new Map<number, number>();
    let flies: Fly[] = [];
    let fallers: Faller[] = [];
    let flock: Flock | null = null;
    let meteor: Meteor | null = null;
    let fireball: Meteor | null = null;
    // Rare moments: a satellite crossing the stars, a plane crossing high.
    type Glider = { x: number; y: number; vx: number; vy: number; age: number; flare: boolean };
    let satellite: Glider | null = null;
    let plane: Glider | null = null;
    let nextSatellite = 50 + Math.random() * 50;
    let nextPlane = 70 + Math.random() * 60;
    // One you sent yourself, by clicking the night sky.
    let wish: Meteor | null = null;
    let lastWish = -1e9;
    // Where the last one crossed, so the next does not retrace its path.
    let lastMeteorX = -1;
    let nextFlock = 6 + Math.random() * 10;

    /* ---------------- the pointer, for the constellation ---------------- */

    // Where the pointer is, and how present it is: eased towards 1 while it
    // moves over the sky and back to 0 when it leaves or rests, so the links
    // fade in and out rather than switching.
    const pointer = { x: -1, y: -1, live: false, presence: 0, idle: 0, moved: -1e9, stir: 0 };
    const REACH = 180;

    let nextMeteor = 3 + Math.random() * 6;
    // A fireball: the rare, slow, brilliant one. The first comes soon enough
    // for a visit to see it; after that, one every minute or two.
    let nextFireball = 35 + Math.random() * 40;
    // The sun or moon's disc in canvas pixels (sampled with the paint).
    let disc = { x: -1e4, y: -1e4, r2: 0 };
    const inDisc = (x: number, y: number) => {
      const dx = x - disc.x;
      const dy = y - disc.y;
      return dx * dx + dy * dy < disc.r2;
    };

    /* ---------------- real stars: Polaris and the season's figure ---------------- */

    // Where the open sky is: the margins either side of the page and the band
    // above the panels (measured in idle time with the disc).
    const layout = { left: 0, right: 0, top: 90 };
    type Placed = { fig: Figure; x: number; y: number; w: number; h: number; presence: number; only?: number };
    let placed: Placed[] = [];
    let placedSeason = "";
    // The sky's height they were fitted to: a window resized only vertically
    // moves the horizon, and the figures must move with it.
    let placedHeight = 0;
    // A star's name, shown for a moment when the pointer (or a finger) finds it.
    const label = { text: "", x: 0, y: 0, alpha: 0, until: 0 };
    const fontFamily = getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";
    // Real stars carry their own colour: sprites tinted per colour, cached.
    const tinted = new Map<string, Sprite>();
    const starSprite = (tint: string, bright: boolean) => {
      const key = `${tint}|${bright}`;
      let sprite = tinted.get(key);
      if (!sprite) {
        sprite = bright ? glint(18, dpr, tint) : glow(8, dpr, tint, [[0, 1], [0.25, 0.85], [0.6, 0.2], [1, 0]]);
        tinted.set(key, sprite);
      }
      return sprite;
    };

    /** Fits the figures into the open sky this screen has. */
    const placeFigures = () => {
      placedSeason = paint.season;
      placedHeight = height;
      placed = [];
      const top = Math.max(layout.top + 26, height * 0.14);
      const room = horizon * 0.66 - top;
      const fit = (fig: Figure, maxW: number, maxH: number) => {
        let w = maxW;
        let h = w / fig.aspect;
        if (h > maxH) {
          h = maxH;
          w = h * fig.aspect;
        }
        return { w, h };
      };
      // Only where a figure can be drawn at a size that reads — a cramped
      // 80px Dipper was worse than none.
      if (layout.left >= 130 && room > 110) {
        const { w, h } = fit(littleDipper, Math.min(layout.left - 40, 170), Math.min(room, 210));
        placed.push({ fig: littleDipper, x: (layout.left - w) / 2, y: top + 8, w, h, presence: 0 });
      } else {
        // No margin to hold the Dipper: Polaris alone, in the open band above
        // the panels, just past the wordmark. Every screen gets the North Star.
        placed.push({ fig: littleDipper, x: layout.left + 132, y: Math.max(12, layout.top * 0.24), w: 0, h: 0, presence: 0, only: 0 });
      }
      const fig = seasonal[paint.season];
      if (fig && layout.right >= 140 && room > 110) {
        const { w, h } = fit(fig, Math.min(layout.right - 40, 200), Math.min(room + 30, 240));
        placed.push({ fig, x: width - layout.right + (layout.right - w) / 2, y: top + 34, w, h, presence: 0 });
      }
    };

    const starAt = (P: Placed, i: number): [number, number] =>
      P.only !== undefined ? [P.x, P.y] : [P.x + P.fig.stars[i].x * P.w, P.y + P.fig.stars[i].y * P.h];

    /** A named star within `reach` of a point, if there is one. */
    const namedStarNear = (x: number, y: number, reach: number) => {
      for (const P of placed) {
        for (let i = 0; i < P.fig.stars.length; i++) {
          if (P.only !== undefined && i !== P.only) continue;
          const s = P.fig.stars[i];
          if (!s.name) continue;
          const [sx, sy] = starAt(P, i);
          if (Math.hypot(sx - x, sy - y) < reach) return { name: s.name, x: sx, y: sy };
        }
      }
      return null;
    };
    const showLabel = (hit: { name: string; x: number; y: number }, now: number) => {
      label.text = hit.name;
      label.x = hit.x;
      label.y = hit.y;
      label.until = now + 2200;
    };

    const drawFigures = (t: number, dt: number, night: number, now: number) => {
      for (const P of placed) {
        // The figure's lines wake as the pointer comes near it.
        let near = 0;
        if (pointer.live && P.only === undefined) {
          const dx = Math.max(P.x - pointer.x, 0, pointer.x - (P.x + P.w));
          const dy = Math.max(P.y - pointer.y, 0, pointer.y - (P.y + P.h));
          near = Math.hypot(dx, dy) < 70 ? 1 : 0;
        }
        P.presence += (near - P.presence) * Math.min(1, 0.05 * dt);

        if (P.only === undefined) {
          ctx.strokeStyle = paint.particle;
          ctx.lineWidth = 0.8;
          // At rest the figure is its stars — as in the real sky, no lines
          // drawn across it; the outline appears as the pointer comes near.
          ctx.globalAlpha = night * (0.035 + 0.38 * P.presence);
          ctx.beginPath();
          for (const [a, b] of P.fig.lines) {
            const [ax, ay] = starAt(P, a);
            const [bx, by] = starAt(P, b);
            if (inDisc(ax, ay) || inDisc(bx, by)) continue;
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
          }
          ctx.stroke();
        }

        for (let i = 0; i < P.fig.stars.length; i++) {
          if (P.only !== undefined && i !== P.only) continue;
          const s = P.fig.stars[i];
          const [x, y] = starAt(P, i);
          if (inDisc(x, y)) continue;
          const bright = s.mag < 2.1;
          // Polaris barely twinkles; the rest a little, each on its own beat.
          const tw = i === 0 && P.fig === littleDipper ? 0.95 + 0.05 * Math.sin(t * 0.9) : 0.86 + 0.14 * Math.sin(t * (1.1 + i * 0.13) + i * 1.7);
          // Polaris is this sky's guide star: a touch larger and at full light.
          const polaris = i === 0 && P.fig === littleDipper;
          const size = (bright ? 12 + (2.1 - s.mag) * 4.2 : 2.6 + (4.9 - s.mag) * 1.7) * (polaris ? 1.4 : 1);
          ctx.globalAlpha = polaris
            ? night * tw
            : Math.min(1, night * Math.min(1, 0.62 + (4.6 - s.mag) * 0.14) * tw * (1 + P.presence * 0.2));
          ctx.drawImage(starSprite(s.tint ?? "#f4f7ff", bright), x - size / 2, y - size / 2, size, size);
          if (s.name && pointer.live && Math.hypot(pointer.x - x, pointer.y - y) < 16) {
            showLabel({ name: s.name, x, y }, now);
          }
        }
      }

      // The name, fading in beside its star and out again after a moment.
      label.alpha += ((now < label.until ? 1 : 0) - label.alpha) * Math.min(1, 0.12 * dt);
      if (label.alpha > 0.02 && label.text) {
        ctx.font = `500 11px ${fontFamily}`;
        const w = ctx.measureText(label.text).width;
        const lx = Math.min(width - w - 8, label.x + 12);
        const ly = Math.max(14, label.y - 10);
        // On a small dark chip rather than a blurred shadow: as legible over
        // the Milky Way, and a blur on every frame of a hover was the one
        // costly thing in the sky.
        ctx.globalAlpha = label.alpha * Math.max(night, 0.6);
        ctx.fillStyle = "rgba(6, 12, 22, 0.72)";
        ctx.beginPath();
        ctx.roundRect(lx - 6, ly - 12, w + 12, 17, 6);
        ctx.fill();
        ctx.fillStyle = "rgba(236, 242, 255, 0.95)";
        ctx.fillText(label.text, lx, ly);
      }
    };

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

      links.clear();
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
      // The season's pale colours, and how far the hour pushes particles
      // toward their deep variant (0 at night, 1 by day).
      fallLit: "#eef5ff",
      fallLit2: "#eef5ff",
      shade: 0,
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
      flake: null as Sprite | null,
      flake2: null as Sprite | null,
      bokeh: null as Sprite | null,
      head: null as Sprite | null,
      fireHead: null as Sprite | null,
      green: null as Sprite | null,
      beacon: null as Sprite | null,
    };
    let spriteKey = "";
    // The season's firefly density, eased towards here rather than animated
    // in CSS (see --firefly-season): a fifth of the way per sample, so a
    // season change thins or thickens them over about a second.
    let fireflySeason = -1;

    const buildSprites = () => {
      const key = `${paint.particle}|${paint.fallColour}|${paint.fallColour2}|${paint.fallLit}|${paint.fallLit2}`;
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
        // The pale flake itself, for daylight, where it is drawn inside a
        // soft rim of the deep colour (see the season's drawing below).
        flake: glow(8, dpr, paint.fallLit, [[0, 1], [0.45, 0.95], [0.8, 0.35], [1, 0]]),
        flake2: glow(8, dpr, paint.fallLit2, [[0, 1], [0.45, 0.95], [0.8, 0.35], [1, 0]]),
        // An out-of-focus flake: flat across most of its face, soft at the rim.
        bokeh: glow(14, dpr, paint.fallColour, [[0, 0.75], [0.55, 0.62], [0.82, 0.24], [1, 0]]),
        head: glow(10, dpr, "#ffffff", [[0, 1], [0.3, 0.6], [1, 0]]),
        // A fireball's head: a white-hot core in a wide, warm glow.
        fireHead: glow(44, dpr, "#fff4dc", [[0, 1], [0.08, 0.95], [0.22, 0.42], [0.5, 0.12], [1, 0]]),
        beacon: glow(14, dpr, "#ff4f45", [[0, 1], [0.14, 0.95], [0.35, 0.28], [1, 0]]),
        green: glow(14, dpr, "#62ff92", [[0, 1], [0.14, 0.95], [0.35, 0.28], [1, 0]]),
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
        fallLit: str("--fall-lit", "#eef5ff"),
        fallLit2: str("--fall-alt-lit", "#eef5ff"),
        shade: (parseFloat(cs.getPropertyValue("--fall-shade")) || 0) / 100,
        season: root.getAttribute("data-season") ?? "winter",
        windows: num("--windows"),
      };
      buildSprites();
      if (placed.length && paint.season !== placedSeason) placeFigures();
    };

    // Where the sun or moon is. The celestial box is six discs wide; the body
    // itself is the middle sixth. Stars and the network keep clear of it (and
    // a little of its glow): they lie beyond the moon. Meteors burn in front.
    // Read in idle time every two seconds, never inside a frame: reading
    // layout there forced a full layout on every sample while the page was
    // still settling, which showed up as blocking time on a slow phone.
    const sampleDisc = () => {
      if (celestial) {
        const b = celestial.getBoundingClientRect();
        const r = (b.width / 12) * 1.45;
        disc = { x: b.left + b.width / 2, y: b.top + b.height / 2, r2: r * r };
      }
      // The open sky: margins beside the page, and the band above its panels
      // at the top of the page (whatever the scroll).
      const shell = document.querySelector<HTMLElement>(".shell");
      const panel = document.querySelector<HTMLElement>(".panel");
      if (shell) {
        const r = shell.getBoundingClientRect();
        const pad = parseFloat(getComputedStyle(shell).paddingLeft) || 0;
        const left = Math.round(r.left + pad);
        const right = Math.round(width - (r.right - pad));
        const top = panel ? Math.round(panel.getBoundingClientRect().top + window.scrollY) : 90;
        if (left !== layout.left || right !== layout.right || top !== layout.top || height !== placedHeight || !placed.length) {
          layout.left = left;
          layout.right = right;
          layout.top = top;
          placeFigures();
        }
      }
    };
    const idle = (fn: () => void) =>
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(fn, { timeout: 1000 })
        : setTimeout(fn, 200);
    let discTimer = 0;
    const discLoop = () => {
      idle(sampleDisc);
      discTimer = window.setTimeout(discLoop, 2000);
    };

    /* ---------------- the wind ---------------- */

    /*
     * One air for everything that falls. A slow, signed drift (two
     * incommensurate swells, so it never quite repeats) plus a gust every
     * minute or so that sweeps across the screen as a wave, the leading side
     * first. Every leaf, petal, flake and mote reads the same field, so they
     * lean, hurry and tumble together and then settle — where before each
     * swayed on its own private sine and the air had no weather at all.
     * Roughly -1.7..1.7.
     */
    // The drift changes per frame, not per particle: worked out once a frame.
    let windT = -1;
    let windDrift = 0;
    let windDir = 1;
    const windAt = (t: number, x: number) => {
      if (t !== windT) {
        windT = t;
        windDrift = 0.55 * Math.sin(t * 0.045) + 0.35 * Math.sin(t * 0.017 + 2.1);
        windDir = windDrift >= 0 ? 1 : -1;
      }
      const along = (windDir > 0 ? x : width - x) / Math.max(1, width);
      const g = Math.max(0, Math.sin((t - along * 3.2) * 0.14 + 1.1));
      const g2 = g * g;
      return windDrift * 0.45 + windDir * g2 * g2 * g2 * 1.25;
    };
    // How much the season's air carries what it drops: leaves are light and
    // catch every gust, summer's rising motes barely notice it.
    const WIND_STRENGTH: Record<string, number> = { autumn: 1, spring: 0.8, winter: 0.75, summer: 0.45 };

    /* ---------------- satellites and planes ---------------- */

    /*
     * Two of a real night sky's quieter sights, each every few minutes. A
     * satellite: a steady point (it does not twinkle) gliding in a straight
     * line across the stars, sometimes catching the sun on a panel and
     * flaring for a few seconds. A plane, high and far: red and green wing
     * lights and a white strobe double-flashing, crossing the open band
     * above the page. Both are tiny, and neither draws on the city.
     */
    const drawGliders = (t: number, dt: number, night: number) => {
      nextSatellite -= dt / 60;
      nextPlane -= dt / 60;
      if (!satellite && nextSatellite <= 0 && night > 0.6) {
        // Through the open band above the page, where it can be followed
        // all the way across — not behind the panels.
        const fromLeft = Math.random() < 0.5;
        const speed = 0.48 + Math.random() * 0.16;
        const angle = (Math.random() - 0.5) * 0.04;
        satellite = {
          x: fromLeft ? -10 : width + 10,
          y: Math.min(height * 0.08, 70) * (0.25 + Math.random() * 0.6),
          vx: (fromLeft ? 1 : -1) * speed * Math.cos(angle),
          vy: speed * Math.sin(angle),
          age: 0,
          flare: Math.random() < 0.35,
        };
        nextSatellite = 110 + Math.random() * 110;
      }
      if (!plane && nextPlane <= 0 && (night > 0.3 || paint.windows > 0.3)) {
        const fromLeft = Math.random() < 0.5;
        plane = {
          x: fromLeft ? -20 : width + 20,
          y: Math.min(height * 0.07, 62) * (0.35 + Math.random() * 0.5),
          vx: (fromLeft ? 1 : -1) * (0.85 + Math.random() * 0.35),
          vy: (Math.random() - 0.5) * 0.04,
          age: 0,
          flare: false,
        };
        nextPlane = 160 + Math.random() * 120;
      }

      if (satellite) {
        const s = satellite;
        s.age += dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.x < -20 || s.x > width + 20 || s.y < -20 || s.y > horizon) satellite = null;
        else if (sprites.head) {
          // Midway across, a flaring one swells to a brilliant point and fades.
          const across = s.vx > 0 ? s.x / width : 1 - s.x / width;
          const glare = s.flare ? Math.max(0, 1 - Math.abs(across - 0.5) / 0.07) : 0;
          ctx.globalAlpha = Math.min(1, night * (0.62 + glare * 0.38));
          const size = 4 + glare * glare * 12;
          ctx.drawImage(glare > 0.3 && sprites.glint[0] ? sprites.glint[0] : sprites.head, s.x - size / 2, s.y - size / 2, size, size);
        }
      }

      if (plane) {
        const p = plane;
        p.age += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < -40 || p.x > width + 40) plane = null;
        else {
          const seen = Math.max(night, paint.windows * 0.8);
          const dir = p.vx > 0 ? 1 : -1;
          // Wing lights, steady: red to port, green to starboard.
          if (sprites.beacon && sprites.green) {
            ctx.globalAlpha = seen * 0.85;
            ctx.drawImage(dir > 0 ? sprites.beacon : sprites.green, p.x - 5 - 4, p.y - 4, 8, 8);
            ctx.drawImage(dir > 0 ? sprites.green : sprites.beacon, p.x + 5 - 4, p.y - 4, 8, 8);
          }
          // The strobe: a double white flash, once a second or so.
          const ph = (t * 0.85) % 1;
          const flash = ph < 0.05 || (ph > 0.12 && ph < 0.17) ? 1 : 0;
          if (flash && sprites.head) {
            ctx.globalAlpha = seen;
            ctx.drawImage(sprites.head, p.x - 6, p.y - 7, 12, 12);
          }
        }
      }
    };

    /* ---------------- shooting stars ---------------- */

    // Far enough from the last one's path that two never retrace a patch.
    const pickX = () => {
      let x = width * (0.12 + Math.random() * 0.76);
      for (let i = 0; i < 4 && lastMeteorX >= 0 && Math.abs(x - lastMeteorX) < width * 0.22; i++) {
        x = width * (0.12 + Math.random() * 0.76);
      }
      lastMeteorX = x;
      return x;
    };

    const launch = (o: {
      x: number; y: number; angle: number; speed: number; life: number; len: number;
      bright: number; width: number; fireball: boolean;
    }): Meteor => ({
      x: o.x,
      y: o.y,
      vx: Math.sin(o.angle) * o.speed,
      vy: Math.cos(o.angle) * o.speed * 0.45,
      life: o.life,
      age: 0,
      len: o.len,
      bright: o.bright,
      width: o.width,
      fireball: o.fireball,
      sparks: null,
    });

    /** Moves and draws one streak; false once it has burnt out. */
    const stepStreak = (m: Meteor, dt: number, night: number) => {
      m.age += dt;
      const p = m.age / m.life;

      // A fireball's fragments outlive it by a moment, falling and fading.
      if (m.sparks) {
        let alive = false;
        for (const k of m.sparks) {
          k.age += dt;
          if (k.age >= k.life) continue;
          alive = true;
          k.x += k.vx * dt;
          k.y += k.vy * dt;
          k.vy += 0.025 * dt;
          const f = 1 - k.age / k.life;
          if (sprites.head) {
            ctx.globalAlpha = f * f * night;
            const size = 3 + 4 * f;
            ctx.drawImage(sprites.head, k.x - size / 2, k.y - size / 2, size, size);
          }
        }
        if (p >= 1) return alive;
      }
      if (p >= 1) return false;

      m.x += m.vx * dt;
      m.y += m.vy * dt;
      // Burns out in the sky: one that would have fallen into the city fades
      // over its last 60px above the rooftops instead.
      if (m.y >= horizon) return false;

      // Brightens, then burns out; the tail grows as it gathers speed. A
      // fireball holds its light longer and flares near the end.
      const rise = Math.sin(Math.PI * Math.min(1, p));
      const flare = m.fireball && p > 0.62 && p < 0.84 ? 1 + 0.6 * Math.sin(((p - 0.62) / 0.22) * Math.PI) : 1;
      const a = (m.fireball ? Math.pow(rise, 0.55) : rise) * m.bright * night * Math.min(1, (horizon - m.y) / 60);
      const v = Math.hypot(m.vx, m.vy);
      const tail = m.len * Math.min(1, p * (m.fireball ? 1.6 : 2.2));
      const tx = m.x - (m.vx / v) * tail;
      const ty = m.y - (m.vy / v) * tail;
      const grad = ctx.createLinearGradient(m.x, m.y, tx, ty);
      if (m.fireball) {
        // White-hot at the head, a faint green of burning metal behind it,
        // cooling to amber at the end of the trail.
        grad.addColorStop(0, "rgba(255,252,240,1)");
        grad.addColorStop(0.12, "rgba(255,244,214,0.85)");
        grad.addColorStop(0.38, "rgba(176,255,206,0.42)");
        grad.addColorStop(0.72, "rgba(255,176,104,0.16)");
        grad.addColorStop(1, "rgba(255,150,90,0)");
      } else {
        grad.addColorStop(0, "rgba(255,255,255,0.95)");
        grad.addColorStop(0.25, "rgba(220,235,255,0.35)");
        grad.addColorStop(1, "rgba(220,235,255,0)");
      }
      ctx.strokeStyle = grad;
      ctx.lineCap = "round";
      if (m.fireball) {
        // The air around a fireball's trail glows too: a wide, faint halo
        // under the bright core.
        ctx.globalAlpha = Math.min(1, a) * 0.22;
        ctx.lineWidth = m.width * 3.2;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      }
      ctx.globalAlpha = Math.min(1, a);
      ctx.lineWidth = m.width;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();

      // A meteor burns in our own air, in front of the moon — unlike the
      // stars, it may cross the disc.
      if (m.fireball && sprites.fireHead) {
        const size = 40 * flare;
        ctx.globalAlpha = Math.min(1, a * 0.9);
        ctx.drawImage(sprites.fireHead, m.x - size / 2, m.y - size / 2, size, size);
      } else if (sprites.head) {
        const size = 7 + 3 * m.bright;
        ctx.drawImage(sprites.head, m.x - size / 2, m.y - size / 2, size, size);
      }

      // Breaking up: once, as it burns out, a fireball sheds fragments that
      // carry on along its path a little way, slower, and fall.
      if (m.fireball && !m.sparks && p > 0.82) {
        m.sparks = Array.from({ length: 5 + Math.floor(Math.random() * 3) }, () => ({
          x: m.x,
          y: m.y,
          vx: m.vx * (0.35 + Math.random() * 0.3) + (Math.random() - 0.5) * 0.9,
          vy: m.vy * (0.35 + Math.random() * 0.3) + (Math.random() - 0.5) * 0.6,
          age: 0,
          life: 26 + Math.random() * 22,
        }));
      }
      return true;
    };

    /* ---------------- drawing ---------------- */

    const draw = (now: number, dt: number) => {
      const t = now / 1000;
      ctx.clearRect(0, 0, width, height);
      const { stars: night, fireflies, birds, fall } = paint;
      // Stars dim towards the horizon, through the thicker, hazier air low
      // over a city — the band just above the rooftops holds the faintest.
      const low = height * 0.16;

      // --- background stars: still, twinkling ---
      if (night > 0.01) {
        for (const s of stars) {
          if (inDisc(s.x, s.y)) continue;
          const tw = 0.55 + 0.45 * Math.sin(t * s.rate + s.phase);
          const air = 0.3 + 0.7 * Math.min(1, (horizon - s.y) / low);
          ctx.globalAlpha = night * (s.bright ? 0.9 : 0.5) * tw * air;
          const sprite = s.bright ? sprites.glint[s.tint] : sprites.star[s.tint];
          const size = s.bright ? 12 + s.r * 4 : 3 + s.r * 3;
          ctx.drawImage(sprite, s.x - size / 2, s.y - size / 2, size, size);
        }
      }

      // --- Polaris and the season's constellation ---
      if (night > 0.01) drawFigures(t, dt, night, now);

      // --- the constellation: drifting, linked when close ---
      if (night > 0.01) {
        for (const d of dots) {
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          if (d.x < 0 || d.x > width) d.vx *= -1;
          if (d.y < 0 || d.y > horizon) d.vy *= -1;
        }
        // Each star links to its nearest neighbour within reach, and only
        // that: a nearest-neighbour graph cannot close a loop, so the net
        // draws short, branching figures like a star chart's rather than the
        // mesh of triangles every-pair-in-range gave. Links ease in and out
        // as the drift changes who is nearest, so nothing pops.
        const nearest = new Set<number>();
        for (let i = 0; i < dots.length; i++) {
          let best = -1;
          let bestD2 = 16900; // 130px
          for (let j = 0; j < dots.length; j++) {
            if (j === i) continue;
            const dx = dots[i].x - dots[j].x;
            const dy = dots[i].y - dots[j].y;
            const d2 = dx * dx + dy * dy;
            if (d2 < bestD2) {
              bestD2 = d2;
              best = j;
            }
          }
          if (best >= 0) nearest.add(i < best ? i * 1000 + best : best * 1000 + i);
        }
        for (const k of nearest) if (!links.has(k)) links.set(k, 0);
        ctx.strokeStyle = paint.particle;
        ctx.lineWidth = 0.7;
        for (const [k, w] of links) {
          // In slowly, out quickly: an outgoing link overlapping its
          // replacement for long would briefly close a triangle again.
          const on = nearest.has(k);
          const next = w + ((on ? 1 : 0) - w) * Math.min(1, (on ? 0.04 : 0.14) * dt);
          if (next < 0.01 && !nearest.has(k)) {
            links.delete(k);
            continue;
          }
          links.set(k, next);
          const a = dots[Math.floor(k / 1000)];
          const b = dots[k % 1000];
          if (!a || !b || inDisc(a.x, a.y) || inDisc(b.x, b.y)) continue;
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist > 130) continue;
          // Delicate: threads between stars, not lines over the sky.
          ctx.globalAlpha = Math.max(0, 1 - dist / 130) * 0.13 * night * next;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
        // The pointer joins the net: links to the stars within reach, and a
        // signal running along each one, out from the pointer, on its own beat.
        pointer.idle += dt;
        const wanted = pointer.live && pointer.y < horizon && pointer.idle < 240 ? 1 : 0;
        pointer.presence += (wanted - pointer.presence) * Math.min(1, 0.06 * dt);
        const reach = pointer.presence > 0.01 ? night * pointer.presence : 0;
        if (reach > 0) {
          ctx.lineWidth = 0.8;
          for (const d of dots) {
            const dx = d.x - pointer.x;
            const dy = d.y - pointer.y;
            const dist = Math.hypot(dx, dy);
            if (dist > REACH || inDisc(d.x, d.y)) continue;
            const k = 1 - dist / REACH;
            // Reached for, gently: a near star leans a little towards it.
            d.x -= dx * 0.004 * k * dt * pointer.presence;
            d.y -= dy * 0.004 * k * dt * pointer.presence;
            ctx.globalAlpha = k * 0.42 * reach;
            ctx.beginPath();
            ctx.moveTo(pointer.x, pointer.y);
            ctx.lineTo(d.x, d.y);
            ctx.stroke();
            if (sprites.dot) {
              const f = (t * 0.55 + d.phase) % 1;
              ctx.globalAlpha = k * reach * Math.sin(f * Math.PI);
              ctx.drawImage(sprites.dot, pointer.x + dx * f - 3, pointer.y + dy * f - 3, 6, 6);
            }
          }
        }

        if (sprites.dot) {
          for (const d of dots) {
            if (inDisc(d.x, d.y)) continue;
            let lit = 0;
            if (reach > 0) {
              const dist = Math.hypot(d.x - pointer.x, d.y - pointer.y);
              if (dist < REACH) lit = (1 - dist / REACH) * reach;
            }
            ctx.globalAlpha = Math.min(1, night * (0.38 + 0.14 * Math.sin(t * 0.8 + d.phase)) + lit * 0.5);
            const size = 4 + d.r * 4 + lit * 5;
            ctx.drawImage(sprites.dot, d.x - size / 2, d.y - size / 2, size, size);
          }
        }
      }

      // --- shooting stars: often, and each one its own ---
      // The rate is the sky's signature and stays as it was — one every 5-14s
      // on a dark night. What changed is that no two are alike: some are
      // quick and faint, most as bright as ever, a few long and brilliant.
      // And now and then a fireball (below).
      if (night > 0.5 && !still) {
        nextMeteor -= dt / 60;
        nextFireball -= dt / 60;
        if (!meteor && nextMeteor <= 0) {
          const roll = Math.random();
          const bright = roll < 0.3 ? 0.62 + Math.random() * 0.14 : roll < 0.85 ? 0.92 + Math.random() * 0.08 : 1;
          const long = roll >= 0.85;
          meteor = launch({
            x: pickX(),
            y: height * Math.random() * 0.3,
            angle: (Math.random() < 0.5 ? 1 : -1) * (0.3 + Math.random() * 0.4),
            speed: (long ? 10 : 8) + Math.random() * 7,
            life: (long ? 55 : 34) + Math.random() * 26,
            len: (long ? 150 : 70) + Math.random() * (long ? 90 : 80),
            bright,
            width: long ? 1.7 : 1.05 + bright * 0.3,
            fireball: false,
          });
          nextMeteor = 5 + Math.random() * 9;
        }
        if (!fireball && nextFireball <= 0) {
          // Where it can be seen: a long, shallow glide through the open sky
          // above the panels, from near one side towards the middle — not
          // down behind the glass, where it would be over before it showed.
          const fromLeft = Math.random() < 0.5;
          fireball = launch({
            x: width * (fromLeft ? 0.04 + Math.random() * 0.22 : 0.74 + Math.random() * 0.22),
            y: Math.min(height * 0.07, 64) * (0.25 + Math.random() * 0.5),
            // Nearly level (a 2-5% descent): the open band above the panels
            // is under 100px tall, and the brightest part must cross it.
            angle: (fromLeft ? 1 : -1) * (1.45 + Math.random() * 0.07),
            speed: 5.4 + Math.random() * 1.6,
            life: 130 + Math.random() * 40,
            len: 260 + Math.random() * 120,
            bright: 1,
            width: 2.6,
            fireball: true,
          });
          nextFireball = 60 + Math.random() * 60;
        }
      }
      // --- now and then: a satellite, a plane ---
      if (!still) drawGliders(t, dt, night);

      if (meteor && !stepStreak(meteor, dt, night)) meteor = null;
      if (fireball && !stepStreak(fireball, dt, night)) fireball = null;
      if (wish && !stepStreak(wish, dt, Math.max(night, 0.6))) wish = null;

      // --- birds, crossing by day in a loose V ---
      if (birds > 0.05 && !still) {
        nextFlock -= dt / 60;
        if (!flock && nextFlock <= 0) {
          const dir = Math.random() < 0.5 ? 1 : -1;
          // Now and then a single bird rather than a flock.
          const lone = Math.random() < 0.2;
          const n = lone ? 1 : 3 + Math.floor(Math.random() * 5);
          const y0 = height * (0.06 + Math.random() * 0.3);
          const x0 = dir > 0 ? -60 : width + 60;
          // Distance: a nearer flock is larger and crosses faster.
          const depth = 0.8 + Math.random() * 0.45;
          flock = {
            dir,
            speed: (0.75 + Math.random() * 0.45) * depth,
            birds: Array.from({ length: n }, (_, i) => {
              const rank = Math.ceil(i / 2);
              const side = i % 2 ? 1 : -1;
              const flap = Math.random() * Math.PI * 2;
              return {
                x: x0 - dir * rank * (16 + Math.random() * 6) * depth,
                y: y0 + side * rank * (9 + Math.random() * 5) * depth,
                flap,
                rate: 0.16 + Math.random() * 0.06,
                size: (lone ? 5.2 : 4.2) * depth + Math.random() * 1.6,
                // Out of step: each bird starts somewhere in its own cycle.
                until: Math.floor(flap / (Math.PI * 2)) + 2 + Math.floor(Math.random() * 4),
                glide: Math.random() < 0.35 ? 20 + Math.random() * 60 : 0,
                bob: Math.random() * Math.PI * 2,
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
        // A tail wind speeds a flock a little, a head wind slows it.
        const air = 1 + windAt(t, flock.birds[0].x) * 0.06 * flock.dir;
        for (const b of flock.birds) {
          b.x += flock.dir * flock.speed * air * dt;
          b.y += Math.sin(t * 0.7 + b.bob) * 0.06 * dt;
          // Flap, then glide: a burst of wingbeats, then wings held out and
          // a gentle sink, then beating again — the way real birds cross a
          // sky, rather than beating without pause.
          let lift: number;
          if (b.glide > 0) {
            b.glide -= dt;
            b.y += 0.035 * dt;
            lift = 0.22;
          } else {
            b.flap += b.rate * dt;
            b.y -= 0.02 * dt;
            lift = Math.sin(b.flap);
            const beats = Math.floor(b.flap / (Math.PI * 2));
            if (beats >= b.until) {
              b.glide = 45 + Math.random() * 75;
              b.until = beats + 3 + Math.floor(Math.random() * 4);
            }
          }
          if (flock.dir > 0 ? b.x < width + 40 : b.x > -40) out = false;
          // Wings: two arcs whose tips rise and fall with the beat.
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
        const carry = (WIND_STRENGTH[season] ?? 0.7) * (winged ? 0.9 : rising ? 0.35 : 0.6);
        // A moving pointer stirs the air around it; resting, it lets it settle.
        pointer.stir += ((pointer.live && now - pointer.moved < 1400 ? 1 : 0) - pointer.stir) * Math.min(1, 0.08 * dt);
        const stir = pointer.stir;
        const snow = season === "winter";
        // Daylight: the hour has pushed particles toward their deep colour.
        const daylight = paint.shade > 0.5;
        for (const d of fallers) {
          // Fade in over the last eighth of the threshold so a season change
          // thickens the air rather than popping particles into existence.
          const a = fall - d.t;
          if (a <= 0) continue;
          const alpha = Math.min(1, a * 8) * (0.42 + 0.34 * Math.min(1, d.z));
          if (!still) {
            // The shared air: a nearer particle is pushed further, its own
            // sway widens in a gust, and leaves tumble faster while it blows.
            const w = windAt(t, d.x);
            const gusty = Math.abs(w);
            d.y += d.speed * drop * dt;
            d.x += Math.sin(t * 0.6 + d.phase) * (d.sway / 90) * swayScale * (1 + gusty * 0.4) * dt;
            d.x += w * carry * (0.55 + 0.45 * d.z) * dt;
            d.angle += d.spin * (1 + gusty * 1.4) * dt;
            d.flip += d.flipRate * (1 + gusty * 1.4) * dt;
            if (stir > 0.01) {
              const sx = d.x - pointer.x;
              const sy = d.y - pointer.y;
              const r2 = sx * sx + sy * sy;
              if (r2 < 12100 && r2 > 1) {
                // Swirled aside: pushed out from the pointer, a little
                // sideways round it, and set tumbling.
                const r = Math.sqrt(r2);
                const k = (1 - r / 110) * stir * dt;
                d.x += (sx / r) * k * 1.7 - (sy / r) * k * 0.6;
                d.y += (sy / r) * k * 0.9 + (sx / r) * k * 0.3;
                d.angle += d.spin * 5 * k;
                d.flip += d.flipRate * 4 * k;
              }
            }
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
            ctx.beginPath();
            if (season === "spring") {
              // A cherry petal: rounded from the base, with the notch at its
              // outer edge that makes it read as a petal, not a seed.
              ctx.moveTo(-L, 0);
              ctx.quadraticCurveTo(-L * 0.1, -W * 1.45, L, -W * 0.4);
              ctx.lineTo(L * 0.68, 0);
              ctx.lineTo(L, W * 0.4);
              ctx.quadraticCurveTo(-L * 0.1, W * 1.45, -L, 0);
            } else {
              ctx.moveTo(-L, 0);
              ctx.quadraticCurveTo(0, -W * 1.5, L, 0);
              ctx.quadraticCurveTo(0, W * 1.5, -L, 0);
            }
            if (daylight && season === "spring") {
              // A petal in daylight is pale, not a dark speck: blossom
              // colour, edged finely in its deep shade so it still shows
              // against bright cloud. (Leaves stay dark by day — that is
              // how a leaf reads against the sky.)
              ctx.fillStyle = d.alt ? paint.fallLit2 : paint.fallLit;
              ctx.fill();
              ctx.lineWidth = 0.7;
              ctx.strokeStyle = d.alt ? paint.fallColour2 : paint.fallColour;
              ctx.stroke();
            } else {
              ctx.fillStyle = d.alt ? paint.fallColour2 : paint.fallColour;
              ctx.fill();
            }
            // A leaf large enough to show it gets its midrib, running on
            // past the base as the stalk.
            if (season === "autumn" && L >= 3) {
              ctx.beginPath();
              ctx.moveTo(-L * 1.3, 0);
              ctx.lineTo(L * 0.82, 0);
              ctx.lineWidth = 0.55;
              ctx.strokeStyle = daylight ? "rgba(255,236,200,0.28)" : "rgba(60,26,0,0.38)";
              ctx.stroke();
            }
            ctx.restore();
          } else {
            const sprite = d.alt ? sprites.snow2 : sprites.snow;
            if (!sprite) continue;
            const size = (rising ? 2.6 : 3.4) * d.z + 1.6;
            const flake = d.alt ? sprites.flake2 : sprites.flake;
            if (daylight && flake) {
              // Snow and pollen in daylight: a pale core inside a soft rim
              // of the deep colour. Dark specks alone read as ash or dust;
              // the rim is what keeps a white flake visible on white cloud.
              const rim = size * 1.7;
              ctx.globalAlpha = alpha * 0.5;
              ctx.drawImage(sprite, d.x - rim / 2, d.y - rim / 2, rim, rim);
              ctx.globalAlpha = alpha;
              ctx.drawImage(flake, d.x - size / 2, d.y - size / 2, size, size);
            } else if (snow && d.z > 1.2 && sprites.bokeh) {
              // Snow close to the eye is out of focus: a larger, softer disc,
              // fainter for being spread wide — the depth that makes a
              // snowfall read as falling through space, not on one plane.
              const near = size * (1.6 + (d.z - 1.2) * 2.4);
              ctx.globalAlpha = alpha * 0.7;
              ctx.drawImage(sprites.bokeh, d.x - near / 2, d.y - near / 2, near, near);
            } else {
              if (snow && d.z < 0.7) ctx.globalAlpha = alpha * 0.85;
              ctx.drawImage(sprite, d.x - size / 2, d.y - size / 2, size, size);
            }
          }
        }
      }

      // --- aviation lights on the masts ---
      // The near skyline's tile is centred on the viewport and repeats every
      // NEAR_TILE.w, anchored to the bottom like the skyline itself, so each
      // light sits on its mast.
      // Two sets, on different rhythms, as unrelated towers are.
      const beacons = Math.min(1, Math.max(0, (paint.windows - 0.2) * 2));
      if (beacons > 0.01 && sprites.beacon) {
        const first = width / 2 - NEAR_TILE.w / 2;
        const start = first - Math.ceil(first / NEAR_TILE.w) * NEAR_TILE.w;
        const top = height - NEAR_TILE.h;
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
          const y = f.y;
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
        sampleDisc();
        draw(performance.now(), 0);
      } else {
        idle(sampleDisc);
      }
    };

    resize();

    if (still) {
      // One still frame, repainted only when the sky itself changes.
      const observer = new MutationObserver(() => {
        samplePaint();
        sampleDisc();
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

    // Fine pointers only: a finger has no hover, and on a phone this would
    // be a cost with nothing to show for it.
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.live = true;
      pointer.idle = 0;
      pointer.moved = performance.now();
    };
    const onLeave = () => {
      pointer.live = false;
    };

    // Click or tap the open night sky: a shooting star of your own, from that
    // point (one every two seconds at most). On a named star, its name. Never
    // on anything that is the page — panels, links, buttons, a selection.
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest("a, button, input, textarea, select, label, summary, [role], [tabindex], .panel, .tile, .dock, .site-nav, footer")) return;
      if (window.getSelection()?.toString()) return;
      const x = e.clientX;
      const y = e.clientY;
      if (y > horizon) return;
      const now = performance.now();
      const hit = namedStarNear(x, y, 24);
      if (hit && paint.stars > 0.3) return showLabel(hit, now);
      if (paint.stars < 0.5 || now - lastWish < 2000) return;
      lastWish = now;
      wish = launch({
        x,
        y,
        angle: (x < width / 2 ? 1 : -1) * (0.5 + Math.random() * 0.35),
        speed: 9 + Math.random() * 4,
        life: 52 + Math.random() * 16,
        len: 140 + Math.random() * 60,
        bright: 1,
        width: 1.6,
        fireball: false,
      });
    };

    raf = requestAnimationFrame(frame);
    discLoop();
    document.addEventListener("click", onClick);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    if (!coarse) {
      window.addEventListener("pointermove", onPointer, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      window.addEventListener("blur", onLeave);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(discTimer);
      document.removeEventListener("click", onClick);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, [mounted]);

  if (!mounted) return null;
  return <canvas ref={ref} aria-hidden="true" className="constellation" />;
}
