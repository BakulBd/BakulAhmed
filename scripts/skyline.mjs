/**
 * Draws the city the sky sets over, and writes it to app/scene-art.css.
 *
 * Run: npm run skyline     (then commit the regenerated stylesheet)
 *
 * Everything here is deterministic — a seeded generator, not Math.random — so
 * the skyline never changes between builds unless this file does. The output
 * is plain SVG used as CSS masks, written out literally in every rule: an image
 * passed through a custom property is re-resolved on every frame of a mood
 * change and re-rasterised each time (see README, "Performance").
 *
 * What it draws, back to front:
 *
 *   far   a dense, low, hazy city: thin blocks, the odd mast. Lit by nothing,
 *         it is mostly air — the haze between it and the next plane is what
 *         makes the three read as distance rather than as three outlines.
 *   mid   mid-rise blocks with rooftop water tanks — the shape every Dhaka
 *         roofline actually has — and one mosque: a domed hall and a minaret.
 *   near  the nearest plane, and the only one with detail at full contrast:
 *         towers with setbacks and antenna masts, tanks, stepped and slanted
 *         roofs, a mosque with two minarets. Its outline also drives the lit
 *         rooftops (.scene__rim), so the light always sits on a roof.
 *
 * And, laid over the near plane:
 *
 *   windows  per building, never a grid across the whole city. Each facade
 *            takes one of several window patterns (small residential panes,
 *            office strips, a lit floor), offset by where the building
 *            stands. Split into two sets: the first comes on at dusk, the
 *            second only once it is properly dark — the city lights up in
 *            waves rather than at a switch.
 *   masts    where the aviation lights go — exported, and blinked by the
 *            sky's canvas (components/constellation.tsx), so two animated
 *            full-width layers do not have to be composited every frame.
 *
 * And for the sky itself:
 *
 *   dust     unresolved starlight for the Milky Way band: hundreds of faint
 *            points, too many to draw on the canvas every frame, so they are
 *            drawn once, here.
 *   rift     fractal noise that breaks the band into clouds and dark lanes.
 *   cirrus   high, thin, wind-combed streaks above the cumulus — the cloud
 *            that catches colour first at dawn and holds it longest at dusk.
 */
import { writeFileSync } from "node:fs";

/* ---------------- deterministic randomness ---------------- */
const rng = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const r1 = (n) => Math.round(n * 2) / 2; // half-pixel precision is plenty
const f2 = (n) => Number(n.toFixed(2));

/** An SVG string as a CSS url(): single quotes inside, the rest escaped. */
const url = (svg) =>
  `url("data:image/svg+xml,${svg
    .replace(/\s*\n\s*/g, "")
    .replace(/"/g, "'")
    .replace(/%/g, "%25")
    .replace(/#/g, "%23")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E")}")`;

/* ---------------- a skyline, as one closed outline ---------------- */
/**
 * Walks left to right emitting the roofline. Starts and ends on the same
 * low-rise level, so the tile repeats without a seam.
 */
function skyline({ seed, W, H, base, rise, tall, tallOdds, detail, mosques = [] }) {
  const rand = rng(seed);
  const between = (a, b) => a + rand() * (b - a);
  const d = [`M0 ${H}V${H - base}`];
  const facades = []; // { x, w, top } — where windows may go
  const masts = []; // [x, y] tips, for the beacons
  let x = 0;
  const at = (nx) => {
    x = r1(nx);
    d.push(`H${x}`);
  };
  const up = (y) => d.push(`V${r1(y)}`);

  const end = W - 26;
  let mosqueIndex = 0;
  while (x < end) {
    // A mosque at its planned place: a domed prayer hall with its minarets.
    const plan = mosques[mosqueIndex];
    if (plan && x >= plan.at) {
      mosqueIndex++;
      const hall = H - plan.hall;
      // Shaft, gallery, upper shaft, conical cap and finial, drawn from the
      // current point along the top of the outline.
      const minaret = (h) => {
        const mx = x;
        const top = H - h;
        up(top + 18);
        at(mx - 1.5);
        up(top + 15);
        at(mx + 1);
        up(top + 8);
        d.push(`L${r1(mx + 3)} ${r1(top + 1)}V${r1(top - 6)}H${r1(mx + 4)}V${r1(top + 1)}L${r1(mx + 6)} ${r1(top + 8)}`);
        x = r1(mx + 6);
        up(top + 15);
        at(mx + 8.5);
        up(top + 18);
        at(mx + 7);
      };
      up(hall);
      at(x + 4);
      minaret(plan.minaret);
      up(hall);
      at(x + 6);
      // A drum, then the dome — a half-ellipse a little taller than wide —
      // with its finial, all one outline (a second subpath would be closed
      // back to the start and cut a wedge through the city).
      const r = plan.dome;
      const ry = r * 1.08;
      const drum = hall - 4;
      up(drum);
      at(x + 2);
      const x0 = x;
      const cx = x0 + r;
      d.push(
        `A${r} ${f2(ry)} 0 0 1 ${r1(cx - 0.6)} ${r1(drum - ry)}V${r1(drum - ry - 7)}H${r1(cx + 0.6)}V${r1(drum - ry)}` +
          `A${r} ${f2(ry)} 0 0 1 ${r1(x0 + 2 * r)} ${r1(drum)}`,
      );
      x = r1(x0 + 2 * r);
      at(x + 2);
      up(hall);
      at(x + 6);
      if (plan.twin) {
        minaret(plan.minaret - 6);
        up(hall);
      }
      at(x + 10);
      continue;
    }

    const w = r1(between(rise.w[0], rise.w[1]));
    const isTall = rand() < tallOdds;
    const h = isTall ? between(tall[0], tall[1]) : between(rise.h[0], rise.h[1]);
    const top = H - h;
    const x0 = x;
    const kind = rand();
    if (detail && isTall && kind < 0.45) {
      // A tower with a setback crown and a mast.
      const inset = Math.max(3, w * 0.22);
      up(top + 10);
      at(x0 + inset);
      up(top);
      const mx = x0 + w / 2;
      at(mx - 1);
      const tip = top - 16 - rand() * 14;
      up(tip);
      masts.push([mx, tip]);
      at(mx + 1);
      up(top);
      at(x0 + w - inset);
      up(top + 10);
      at(x0 + w);
      facades.push({ x: x0, w, top: top + 10 });
    } else if (detail && kind < 0.5) {
      // Stepped: a lower wing beside the main block.
      const wing = w * between(0.3, 0.45);
      up(top + between(14, 26));
      at(x0 + wing);
      up(top);
      at(x0 + w);
      facades.push({ x: x0, w, top });
    } else if (detail && kind < 0.6) {
      // Slanted roof.
      up(top + 7);
      d.push(`L${r1(x0 + w)} ${r1(top)}`);
      x = r1(x0 + w);
      facades.push({ x: x0, w, top: top + 7 });
    } else if (kind < 0.85 && w > 16) {
      // Flat roof with a water tank (or two) — Dhaka's rooftops.
      up(top);
      const tw = between(5, 9);
      const tx = x0 + between(3, Math.max(4, w - tw - 3));
      at(tx);
      up(top - between(4, 7));
      at(tx + tw);
      up(top);
      if (w > 34 && rand() < 0.4) {
        const t2 = tx + tw + between(3, 8);
        if (t2 + 6 < x0 + w - 2) {
          at(t2);
          up(top - between(3, 5));
          at(t2 + 5);
          up(top);
        }
      }
      at(x0 + w);
      facades.push({ x: x0, w, top });
    } else {
      up(top);
      at(x0 + w);
      facades.push({ x: x0, w, top });
    }
    // Now and then a gap at low-rise level between blocks.
    if (rand() < 0.22) {
      up(H - base - between(0, 10));
      at(x + between(4, 14));
    }
  }
  up(H - base);
  at(W);
  d.push(`V${H}Z`);
  return { d: d.join(""), facades, masts };
}

const tile = (W, H, inner) =>
  `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}' viewBox='0 0 ${W} ${H}'>${inner}</svg>`;

/* ---------------- the three planes ---------------- */
const FAR = skyline({
  seed: 11,
  W: 1240,
  H: 200,
  base: 44,
  rise: { w: [10, 30], h: [50, 98] },
  tall: [100, 132],
  tallOdds: 0.12,
  detail: false,
});
const MID = skyline({
  seed: 29,
  W: 1460,
  H: 220,
  base: 40,
  rise: { w: [16, 44], h: [46, 104] },
  tall: [108, 148],
  tallOdds: 0.1,
  detail: true,
  mosques: [{ at: 900, hall: 46, dome: 15, minaret: 112, twin: false }],
});
const NEAR = skyline({
  seed: 47,
  W: 1680,
  H: 240,
  base: 34,
  rise: { w: [22, 62], h: [44, 112] },
  tall: [124, 176],
  tallOdds: 0.13,
  detail: true,
  mosques: [{ at: 560, hall: 52, dome: 22, minaret: 138, twin: true }],
});

const silhouette = (s, W, H) => tile(W, H, `<path fill='#000' d='${s.d}'/>`);

/* ---------------- windows ---------------- */
/**
 * Window patterns, each one building's worth of facade style. Every lit pane
 * carries its own brightness; dark panes are simply absent. userSpaceOnUse,
 * so each building shows the pattern at a different phase.
 */
function patterns() {
  const rand = rng(83);
  const styles = [
    // [tile w, tile h, pane w, pane h, cols, rows, lit odds] — residential
    { id: "a", w: 24, h: 28, pw: 2, ph: 2.6, cols: 4, rows: 4, odds: 0.34 },
    // office strips: wide, short panes, lit in runs
    { id: "b", w: 30, h: 24, pw: 4.5, ph: 1.8, cols: 5, rows: 4, odds: 0.46, runs: true },
    // tall narrow panes, sparse
    { id: "c", w: 20, h: 36, pw: 1.6, ph: 3.4, cols: 4, rows: 4, odds: 0.26 },
    // dense, mostly lit — a hotel, a hospital
    { id: "d", w: 18, h: 24, pw: 2, ph: 2.4, cols: 3, rows: 3, odds: 0.62 },
  ];
  const defs = styles.map((s) => {
    const sx = s.w / s.cols;
    const sy = s.h / s.rows;
    const panes = [];
    for (let row = 0; row < s.rows; row++) {
      let run = rand() < s.odds;
      for (let col = 0; col < s.cols; col++) {
        const lit = s.runs ? (rand() < 0.2 ? (run = !run) : run) : rand() < s.odds;
        if (!lit) continue;
        const o = f2(0.45 + rand() * 0.55);
        panes.push(
          `<rect x='${f2(col * sx + (sx - s.pw) / 2)}' y='${f2(row * sy + (sy - s.ph) / 2)}' width='${s.pw}' height='${s.ph}'${o < 1 ? ` opacity='${o}'` : ""}/>`,
        );
      }
    }
    return `<pattern id='${s.id}' width='${s.w}' height='${s.h}' patternUnits='userSpaceOnUse'>${panes.join("")}</pattern>`;
  });
  return { defs: defs.join(""), ids: styles.map((s) => s.id) };
}

function windows(s, W, H, seed) {
  const rand = rng(seed);
  const { defs, ids } = patterns();
  const early = [];
  const late = [];
  for (const f of s.facades) {
    if (f.w < 12) continue;
    // Some buildings are simply dark tonight.
    if (rand() < 0.16) continue;
    const x = f.x + 3;
    const w = f.w - 6;
    const y = f.top + 6;
    const h = H - 14 - y;
    if (h < 8 || w < 6) continue;
    const id = ids[Math.floor(rand() * ids.length)];
    const rect = `<rect x='${r1(x)}' y='${r1(y)}' width='${r1(w)}' height='${r1(h)}' fill='url(#${id})'/>`;
    (rand() < 0.48 ? early : late).push(rect);
  }
  return {
    early: tile(W, H, `<defs>${defs}</defs>${early.join("")}`),
    late: tile(W, H, `<defs>${defs}</defs>${late.join("")}`),
  };
}

/* ---------------- Milky Way ---------------- */
/**
 * Unresolved starlight: high-frequency noise with everything but its brightest
 * specks thresholded away — a field of faint points of varied brightness from
 * a few hundred bytes, where 170 placed dots took nine kilobytes. Stitched,
 * so the tile repeats without a seam.
 */
const dust = () =>
  tile(
    260,
    260,
    "<filter id='s' x='0' y='0' width='100%' height='100%'>" +
      "<feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='1' seed='11' stitchTiles='stitch'/>" +
      "<feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 11 -7.9'/></filter>" +
      "<rect width='260' height='260' filter='url(#s)'/>",
  );

/** Fractal noise, thresholded into clumps and lanes. Seamless (stitched). */
const rift = tile(
  640,
  640,
  "<filter id='n' x='0' y='0' width='100%' height='100%'>" +
    "<feTurbulence type='fractalNoise' baseFrequency='0.006 0.011' numOctaves='4' seed='7' stitchTiles='stitch'/>" +
    "<feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 2.6 -0.9'/></filter>" +
    "<rect width='640' height='640' filter='url(#n)'/>",
);

/* ---------------- cirrus ---------------- */
function cirrus() {
  const rand = rng(211);
  const W = 1800;
  const H = 260;
  const out = [];
  // Mares' tails: each family is a bundle of hair-thin fibres combed along a
  // gentle curve by the same high wind, thinning out towards its ends, over a
  // faint veil. Smooth ellipses read as speed lines; the fibres make it
  // cirrus. One rotation per bundle (not per fibre) keeps the tile small.
  for (let fam = 0; fam < 7; fam++) {
    const cx = (fam + 0.2 + rand() * 0.6) * (W / 7);
    const cy = 34 + rand() * (H - 80);
    const span = 180 + rand() * 260;
    const tilt = -7 + rand() * 6;
    const bend = (rand() - 0.5) * 0.0016;
    const n = 9 + Math.floor(rand() * 9);
    let body = `<ellipse cx='0' cy='0' rx='${Math.round(span * 0.55)}' ry='${Math.round(10 + rand() * 9)}' opacity='.3'/>`;
    for (let i = 0; i < n; i++) {
      const along = (rand() - 0.5) * span;
      const y = bend * along * along + (rand() - 0.5) * 18;
      const rx = 30 + rand() * 110 * (1 - Math.abs(along) / span);
      const ry = 0.8 + rand() * 1.6;
      body += `<ellipse cx='${Math.round(along)}' cy='${r1(y)}' rx='${Math.round(rx)}' ry='${ry.toFixed(1)}' opacity='${(0.22 + rand() * 0.5).toFixed(2)}'/>`;
    }
    // The tile repeats, so a bundle crossing an edge is drawn again on the
    // other side — clipped, it left a hard vertical seam in the sky.
    const reach = span * 0.6;
    for (const dx of [0, ...(cx + reach > W ? [-W] : []), ...(cx - reach < 0 ? [W] : [])]) {
      out.push(`<g transform='translate(${Math.round(cx + dx)} ${Math.round(cy)}) rotate(${tilt.toFixed(1)})'>${body}</g>`);
    }
  }
  return tile(
    W,
    H,
    "<defs><radialGradient id='g'><stop offset='0' stop-color='%23fff'/><stop offset='.4' stop-color='%23fff' stop-opacity='.7'/><stop offset='1' stop-color='%23fff' stop-opacity='0'/></radialGradient></defs>".replace(/%23/g, "#") +
      `<g fill='url(#g)'>${out.join("")}</g>`,
  );
}

/* ---------------- write it out ---------------- */
const near = url(silhouette(NEAR, 1680, 240));
const win = windows(NEAR, 1680, 240, 59);
const mask = (selector, value, extra = "") =>
  `${selector} {\n  -webkit-mask-image: ${value};\n  mask-image: ${value};${extra}\n}\n`;

const css = `/* Generated by scripts/skyline.mjs — edit that, then run \`npm run skyline\`.
 *
 * The city and the high sky, as masks. Positioning, colour and timing live in
 * app/globals.css; this file holds only the shapes, written out literally in
 * every rule (an image passed through a custom property re-rasterises on
 * every frame of a mood change).
 *
 * Tiles: far 1240x200, mid 1460x220, near 1680x240 — different widths, so the
 * three planes never repeat in step.
 */
${mask(".scene__ridge--far", url(silhouette(FAR, 1240, 200)))}
${mask(".scene__ridge--mid", url(silhouette(MID, 1460, 220)))}
${mask(".scene__ridge--near", near)}
${mask(".scene__rim", `${near}, ${near}`)}
${mask(".scene__ridge--near::before", `${url(win.early)}, linear-gradient(to top, transparent 4%, #000 22%)`)}
${mask(".scene__ridge--near::after", `${url(win.late)}, linear-gradient(to top, transparent 4%, #000 22%)`)}
.scene__galaxy {
  background-image:
    radial-gradient(26% 20% at 20% 47%, rgb(255 236 214 / 0.12), transparent),
    linear-gradient(153deg, transparent 27%, rgb(214 222 255 / 0.17) 39%, transparent 51%),
    ${url(dust())};
  background-size: 100% 100%, 100% 100%, 260px 260px;
  -webkit-mask-image: ${url(rift)}, linear-gradient(153deg, transparent 23%, #000 35%, #000 43%, transparent 55%);
  mask-image: ${url(rift)}, linear-gradient(153deg, transparent 23%, #000 35%, #000 43%, transparent 55%);
}
${mask(".scene__cirrus", url(cirrus()))}`;

writeFileSync(new URL("../app/scene-art.css", import.meta.url), css);

/* The same city for everything that is not the page: the share cards
   (lib/og.tsx) and the app icons (scripts/icons.mjs) draw from these shapes,
   so a shared link and a home-screen icon show the skyline the site does. */
const windowsInner = (svg) => svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
writeFileSync(
  new URL("../lib/skyline-art.json", import.meta.url),
  JSON.stringify(
    {
      far: { w: 1240, h: 200, d: FAR.d },
      mid: { w: 1460, h: 220, d: MID.d },
      near: { w: 1680, h: 240, d: NEAR.d, masts: NEAR.masts.map(([x, y]) => [r1(x), r1(y)]), windows: windowsInner(win.early) + windowsInner(win.late).replace(/<defs>[\s\S]*?<\/defs>/, "") },
    },
    null,
    1,
  ) + "\n",
);
// The only part of the city the browser's script needs: where the masts are,
// for the aviation lights the sky's canvas blinks.
writeFileSync(
  new URL("../lib/skyline-masts.ts", import.meta.url),
  `// Generated by scripts/skyline.mjs — the near skyline's tile and its mast tips.\n` +
    `export const NEAR_TILE = { w: 1680, h: 240 } as const;\n` +
    `export const MASTS: readonly (readonly [number, number])[] = ${JSON.stringify(NEAR.masts.map(([x, y]) => [r1(x), r1(y)]))};\n`,
);

console.log(
  `skyline: far ${FAR.facades.length}, mid ${MID.facades.length}, near ${NEAR.facades.length} buildings; ` +
    `${NEAR.masts.length} beacons; ${(css.length / 1024).toFixed(1)} KB`,
);
