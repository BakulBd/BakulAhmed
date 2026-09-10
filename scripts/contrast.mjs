/**
 * Legibility gate for the glass design.
 *
 * Text sits on a translucent panel over a live scene, so the effective
 * background is the panel composited over whatever sky is behind it. This
 * composites every panel over the extremes of its own mood (sky top, sky
 * bottom, and the horizon glow) and fails if any text pair drops below AA.
 *
 * Run: node scripts/contrast.mjs
 */
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

const block = (selector) => {
  const i = css.indexOf(selector);
  if (i === -1) throw new Error(`missing block: ${selector}`);
  return css.slice(i, css.indexOf("}", i));
};
const varOf = (text, name) => {
  const m = text.match(new RegExp(`--${name}:\\s*([^;]+);`));
  return m ? m[1].trim() : null;
};

const hex = (h) => {
  h = h.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const rgbTriplet = (s) => s.split(/\s+/).map(Number);
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
/** src over dst at alpha a */
const over = (src, dst, a) => src.map((c, i) => Math.round(c * a + dst[i] * (1 - a)));

const root = block(":root {");
const rootPanelA = Number(varOf(root, "panel-a"));
const rootTileA = Number(varOf(root, "tile-a"));

const moods = ["dawn", "day", "dusk", "night"].map((id) => {
  const b = block(`[data-mood="${id}"] {`);
  return {
    id,
    // One surface theme across every mood — the hour lives in the sky.
    theme: "dark",
    skyA: hex(varOf(b, "sky-a")),
    skyB: hex(varOf(b, "sky-b")),
    glow: hex(varOf(b, "glow")),
    glowA: Number(varOf(b, "glow-a")),
    accent: hex(varOf(b, "accent")),
    accent2: hex(varOf(b, "accent-2")),
    accentContrast: hex(varOf(b, "accent-contrast")),
  };
});

const themes = Object.fromEntries(
  ["dark"].map((t) => {
    const b = block(`[data-theme="${t}"],`);
    // A theme may raise the alpha floor (white glass over a bright sky needs
    // more than dark glass does); fall back to the :root value.
    return [t, {
      panel: rgbTriplet(varOf(b, "panel-rgb")),
      tile: rgbTriplet(varOf(b, "tile-rgb")),
      fg: hex(varOf(b, "fg")),
      soft: hex(varOf(b, "fg-soft")),
      muted: hex(varOf(b, "fg-muted")),
      panelA: Number(varOf(b, "panel-a") ?? rootPanelA) || rootPanelA,
      tileA: Number(varOf(b, "tile-a") ?? rootTileA) || rootTileA,
    }];
  }),
);

const AA = 4.5;
const AA_LARGE = 3;
const failures = [];
let checks = 0;

for (const mood of moods) {
  const th = themes[mood.theme];
  // Worst-case backdrops behind a panel for this mood.
  const backdrops = [
    ["sky-top", mood.skyA],
    ["sky-mid", mood.skyB],
    ["glow", over(mood.glow, mood.skyB, mood.glowA)],
  ];

  for (const [where, backdrop] of backdrops) {
    const panelBg = over(th.panel, backdrop, th.panelA);
    const tileBg = over(th.tile, panelBg, th.tileA);

    for (const [surface, bg] of [["panel", panelBg], ["tile", tileBg]]) {
      for (const [name, fg, min] of [
        ["fg", th.fg, AA],
        ["soft", th.soft, AA],
        ["muted", th.muted, AA],
        ["accent", mood.accent, AA],
      ]) {
        checks++;
        const r = ratio(fg, bg);
        if (r < min) {
          failures.push(`${mood.id}/${mood.theme} ${surface} over ${where}: ${name} = ${r.toFixed(2)} (needs ${min})`);
        }
      }
    }
  }

  // Text printed on the accent itself (buttons, active pills).
  checks++;
  const onAccent = ratio(mood.accentContrast, mood.accent);
  if (onAccent < AA) {
    failures.push(`${mood.id}: accent-contrast on accent = ${onAccent.toFixed(2)} (needs ${AA})`);
  }
  checks++;
  const onAccent2 = ratio(mood.accentContrast, mood.accent2);
  if (onAccent2 < AA_LARGE) {
    failures.push(`${mood.id}: accent-contrast on accent-2 = ${onAccent2.toFixed(2)} (needs ${AA_LARGE})`);
  }
}

console.log(`contrast gate: ${checks} checks across ${moods.length} moods`);
for (const [name, th] of Object.entries(themes)) {
  console.log(`  ${name}: panel alpha ${th.panelA}, tile alpha ${th.tileA}`);
}
if (failures.length) {
  console.log(`\n${failures.length} FAILURES`);
  failures.forEach((f) => console.log("  ✗ " + f));
  process.exit(1);
}
console.log("\nall pass at AA");
