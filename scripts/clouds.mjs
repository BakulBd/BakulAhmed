/**
 * Draws the two cloud decks and writes them into app/globals.css.
 *
 * Run: npm run clouds     (then commit the updated stylesheet)
 *
 * Seeded like scripts/skyline.mjs, so the sky never changes between builds
 * unless this file does. Each tile is written out literally three times in
 * globals.css — as the shading image and as both mask prefixes — because an
 * image passed through a custom property re-rasterises on every frame of a
 * mood change (see README, "Performance"). This script finds each tile by its
 * size and replaces every copy.
 *
 *   cumulus  1600x600. Six clouds, each built from its own seed, so no two
 *            share a silhouette: a flat, shaded base, a dome of puffs over
 *            it, and a tower or two on the bigger ones. The puffs are lit
 *            from above and fade to a pale rim rather than a grey one — a
 *            grey rim drew a ring round every puff, and the clouds read as
 *            bubble wrap. The shade lives in the base instead, where it is
 *            on a real cumulus.
 *   haze     1600x320. Horizon stratus: long, thin streaks laid over one
 *            another in five bands, so the low deck reads as layered haze
 *            rather than five flat discs.
 *
 * Both tiles repeat along x; anything crossing an edge is drawn again on the
 * far side, so the drift loops without a seam.
 */
import { readFileSync, writeFileSync } from "node:fs";

const rng = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const r = (n) => Math.round(n);

const url = (svg) =>
  `url("data:image/svg+xml,${svg
    .replace(/\s*\n\s*/g, "")
    .replace(/"/g, "'")
    .replace(/%/g, "%25")
    .replace(/#/g, "%23")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E")}")`;

/** An ellipse, and its twin across the seam if it crosses one. */
const ellipse = (W, cx, cy, rx, ry, fill, extra = "") => {
  const one = (x) => `<ellipse cx='${r(x)}' cy='${r(cy)}' rx='${r(rx)}' ry='${r(ry)}' fill='url(#${fill})'${extra}/>`;
  let out = one(cx);
  if (cx - rx < 0) out += one(cx + W);
  if (cx + rx > W) out += one(cx - W);
  return out;
};

/* ---------------- cumulus ---------------- */

/** Where the six clouds stand and how wide each is (its base radius). */
const CLOUDS = [
  [250, 112, 132],
  [760, 71, 87],
  [1210, 130, 143],
  [500, 356, 172],
  [1400, 419, 125],
  [930, 487, 112],
];

function cumulus(W, [cx, by, R], seed) {
  const rand = rng(seed);
  const between = (a, b) => a + rand() * (b - a);
  const parts = [];
  // The cloud leans: its tallest cells sit off-centre, never symmetrical.
  const lean = between(-0.28, 0.28);
  const puffs = [];
  // The bottom row: cells side by side along one condensation level, every
  // one's lower edge on the same line — which is what makes a cumulus base
  // flat, where an arch of puffs read as a croissant.
  const n = 4 + Math.floor(rand() * 3);
  for (let i = 0; i < n; i++) {
    const u = -0.78 + (1.56 * (i + between(0.3, 0.7))) / n;
    const pr = R * between(0.2, 0.28) * (1 - 0.32 * Math.abs(u));
    puffs.push([cx + u * R, by - pr * 0.82, pr * between(1.1, 1.3), pr]);
  }
  // The dome: fewer, bigger cells stacked over the middle of the row.
  const m = 2 + Math.floor(rand() * 3);
  for (let i = 0; i < m; i++) {
    const u = lean + (i / Math.max(1, m - 1) - 0.5) * between(0.6, 0.95);
    const d = Math.min(1, Math.abs(u - lean) * 1.6);
    const pr = R * between(0.24, 0.32) * (1 - 0.35 * d);
    puffs.push([cx + u * R, by - pr * 0.8 - R * between(0.2, 0.3) * (1 - 0.5 * d), pr * between(1.05, 1.2), pr]);
  }
  // A tower on the bigger clouds: cumulus grows upward in cells. It rises
  // out of the dome — sunk into its top — never above it: placed at a fixed
  // height, it floated free over the smaller clouds like a separate ball.
  if (R > 110 || rand() < 0.5) {
    const u = lean + between(-0.15, 0.15);
    const pr = R * between(0.17, 0.22);
    const x = cx + u * R;
    const top = Math.min(
      ...puffs.filter(([px, , prx]) => Math.abs(px - x) < prx).map(([, py, , pry]) => py - pry),
    );
    const rest = Number.isFinite(top) ? top : by - R * 0.4;
    puffs.push([x, rest + pr * between(0.5, 0.65), pr * between(1, 1.12), pr]);
  }
  // Back to front: higher cells first, so the lower, nearer ones overlap them.
  puffs.sort((a, b) => a[1] - b[1]);
  for (const [x, y, rx, ry] of puffs) parts.push(ellipse(W, x, y, rx, ry, "p"));
  // The base fills the gaps between the bottom cells; the shade lies inside
  // the outline, over their lower halves — the underside of a cumulus is in
  // its own shadow, which is what gives the cells above it their volume.
  parts.push(ellipse(W, cx, by - R * 0.06, R * 0.86, R * 0.11, "b"));
  parts.push(ellipse(W, cx + lean * R * 0.2, by - R * 0.1, R * 0.8, R * 0.15, "s"));
  return parts.join("");
}

const cumulusTile = () => {
  const W = 1600;
  return `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='600' viewBox='0 0 ${W} 600'>
<defs>
<radialGradient id='p' cx='.5' cy='.5' r='.5' fx='.44' fy='.3'>
<stop offset='0' stop-color='#fff'/>
<stop offset='.6' stop-color='#fbfcfd'/>
<stop offset='.82' stop-color='#f5f7fa' stop-opacity='.66'/>
<stop offset='1' stop-color='#f2f4f8' stop-opacity='0'/>
</radialGradient>
<radialGradient id='b' cx='.5' cy='.5' r='.5'>
<stop offset='0' stop-color='#c3c9d4'/>
<stop offset='.6' stop-color='#cad0da' stop-opacity='.82'/>
<stop offset='1' stop-color='#cdd2db' stop-opacity='0'/>
</radialGradient>
<radialGradient id='s' cx='.5' cy='.62' r='.5'>
<stop offset='0' stop-color='#a9b2c0' stop-opacity='.5'/>
<stop offset='.65' stop-color='#b8c0cc' stop-opacity='.26'/>
<stop offset='1' stop-color='#c4cad5' stop-opacity='0'/>
</radialGradient>
</defs>
<g>${CLOUDS.map((c, i) => cumulus(W, c, 401 + i * 37)).join("")}</g>
</svg>`;
};

/* ---------------- horizon haze ---------------- */

/** Five bands: centre x, y, half-length, thickness. */
const BANDS = [
  [420, 150, 380, 26],
  [1160, 110, 340, 22],
  [820, 230, 290, 18],
  [240, 262, 170, 13],
  [1400, 250, 180, 14],
];

const hazeTile = () => {
  const W = 1600;
  const rand = rng(977);
  const between = (a, b) => a + rand() * (b - a);
  const parts = [];
  for (const [cx, cy, len, thick] of BANDS) {
    // A soft body for the band, then thinner streaks laid along and over it,
    // each a little off the line, so the edges fray the way haze does.
    parts.push(ellipse(W, cx, cy, len * 0.9, thick * 0.55, "h", " opacity='.7'"));
    const n = 5 + Math.floor(rand() * 3);
    for (let i = 0; i < n; i++) {
      const along = between(-0.72, 0.72) * len;
      const rx = len * between(0.22, 0.48);
      const ry = thick * between(0.18, 0.4);
      parts.push(ellipse(W, cx + along, cy + between(-0.55, 0.55) * thick, rx, ry, "h", ` opacity='${between(0.55, 1).toFixed(2)}'`));
    }
  }
  return `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='320' viewBox='0 0 ${W} 320'>
<defs>
<radialGradient id='h' cx='.5' cy='.5' r='.5'>
<stop offset='0' stop-color='#f1f4f8' stop-opacity='.8'/>
<stop offset='.45' stop-color='#e6eaf0' stop-opacity='.42'/>
<stop offset='1' stop-color='#dfe4eb' stop-opacity='0'/>
</radialGradient>
</defs>
<g>${parts.join("")}</g>
</svg>`;
};

/* ---------------- write ---------------- */

const file = new URL("../app/globals.css", import.meta.url);
let css = readFileSync(file, "utf8");
const replaceTile = (w, h, svg) => {
  const pattern = new RegExp(
    `url\\("data:image/svg\\+xml,%3Csvg xmlns='http://www\\.w3\\.org/2000/svg' width='${w}' height='${h}'[^"]*"\\)`,
    "g",
  );
  const found = css.match(pattern)?.length ?? 0;
  if (found !== 3) throw new Error(`expected 3 copies of the ${w}x${h} cloud tile in globals.css, found ${found}`);
  const value = url(svg);
  css = css.replace(pattern, () => value);
  return value.length;
};
const a = replaceTile(1600, 600, cumulusTile());
const b = replaceTile(1600, 320, hazeTile());
writeFileSync(file, css);
console.log(`clouds: cumulus ${(a / 1024).toFixed(1)} KB, haze ${(b / 1024).toFixed(1)} KB (each written 3x)`);
