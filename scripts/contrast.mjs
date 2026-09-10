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
    clouds: Number(varOf(b, "clouds")),
    cloud: hex(varOf(b, "cloud-color")),
    fallShade: parseFloat(varOf(b, "fall-shade")) / 100,
    seasonLight: Number(varOf(b, "season-light")),
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

const seasons = ["spring", "summer", "autumn", "winter"].map((id) => {
  const b = block(`[data-season="${id}"] {`);
  return {
    id,
    tint: hex(varOf(b, "season-tint")),
    tintA: Number(varOf(b, "season-tint-a")),
    lit: hex(varOf(b, "fall-lit")),
    dim: hex(varOf(b, "fall-dim")),
  };
});

const AA = 4.5;
const AA_LARGE = 3;
const failures = [];
let checks = 0;
let checks_sky = 0;

for (const mood of moods) {
  const th = themes[mood.theme];
  // Every render carries a season, and the season tint is the bottom gradient
  // of the glow layer — it washes the sky before the glow and accent radials
  // land on it. So the backdrop behind a panel is mood AND season, and all
  // sixteen combinations have to hold AA, not just the four moods.
  const backdrops = seasons.flatMap((se) => {
    // Full strength at the top of the page, gone by 70% down.
    // The mood decides how much of the season tint the sky can carry.
    const tint = (base, k) => over(se.tint, base, se.tintA * mood.seasonLight * k);
    return [
      [`sky-top+${se.id}`, tint(mood.skyA, 1)],
      [`sky-mid+${se.id}`, tint(mood.skyB, 0.5)],
      [`glow+${se.id}`, over(mood.glow, tint(mood.skyB, 0.2), mood.glowA)],
    ];
  });

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

/* ------------------------------------------------------------------ *
 * Particle visibility
 *
 * Season particles are painted straight onto the canvas over the sky, so
 * whether they can be seen at all is a contrast problem like any other. The
 * pale palette that reads beautifully at night measured 1.2-1.4 against the
 * bright day sky — invisible — which is why each season carries a deep
 * variant and each mood says how far to go toward it.
 * ------------------------------------------------------------------ */
const toOklch = ([r, g, b]) => {
  const f = (u) => { u /= 255; return u <= 0.04045 ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4; };
  const [R, G, B] = [f(r), f(g), f(b)];
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s2 = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s2;
  const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s2;
  const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s2;
  return { L, C: Math.hypot(A, Bb), H: ((Math.atan2(Bb, A) * 180) / Math.PI + 360) % 360 };
};
const fromOklch = ({ L, C, H }) => {
  const h = (H * Math.PI) / 180;
  const A = C * Math.cos(h);
  const B2 = C * Math.sin(h);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B2) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B2) ** 3;
  const s2 = (L - 0.0894841775 * A - 1.2914855480 * B2) ** 3;
  const g = (u) => {
    u = u <= 0.0031308 ? 12.92 * u : 1.055 * u ** (1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(u * 255)));
  };
  return [
    g(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s2),
    g(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s2),
    g(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s2),
  ];
};
/** color-mix(in oklch, a, b t) — the same space the stylesheet mixes in. */
const mixOklch = (a, b, t) => {
  const A = toOklch(a);
  const B2 = toOklch(b);
  let dh = B2.H - A.H;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  return fromOklch({
    L: A.L + (B2.L - A.L) * t,
    C: A.C + (B2.C - A.C) * t,
    H: (A.H + dh * t + 360) % 360,
  });
};

// The particle is drawn at this alpha in components/constellation.tsx.
const FALL_ALPHA = 0.72;
const FALL_MIN = 1.5;
let worstFall = { r: Infinity };
for (const mood of moods) {
  // What sits behind a particle: the sky with its cloud bank over it.
  const backdrop = over(mood.cloud, mood.skyB, mood.clouds);
  for (const se of seasons) {
    checks++;
    const colour = mixOklch(se.lit, se.dim, mood.fallShade);
    const r = ratio(over(colour, backdrop, FALL_ALPHA), backdrop);
    if (r < worstFall.r) worstFall = { r, mood: mood.id, season: se.id };
    if (r < FALL_MIN) {
      failures.push(
        `${mood.id}/${se.id}: ${se.id} particles are invisible against the sky ` +
        `(${r.toFixed(2)}, needs ${FALL_MIN})`,
      );
    }
  }
}

/* ------------------------------------------------------------------ *
 * Sky geometry
 *
 * The sun and moon have exactly one strip of sky to live in: above the panels
 * and between the wordmark and the mood switcher. Three separate bugs came out
 * of getting this wrong — the body was positioned as a share of the viewport
 * HEIGHT while the panels sat at a fixed offset, so it sank behind them on any
 * display taller than ~760px; it was positioned as a share of viewport WIDTH
 * while the wordmark moved with the shell, so at some widths it parked behind
 * "Bakul Ahmed." and washed the text out; and the clearances ignored the
 * body's own radius, which left it 2px under the switcher at 768px.
 *
 * All of it is arithmetic, so it is checked here rather than in a browser.
 * PANEL_TOP is measured, and the Playwright suite cross-checks it.
 * ------------------------------------------------------------------ */
const len = (text, name) => parseFloat(varOf(text, name));
const skyRoot = block('[data-theme="dark"],');

// Breakpoints, mirroring the media queries in globals.css.
const atWidth = (w) => ({
  shell: w >= 1536 ? 1340 : 1200,
  pad: w >= 1120 ? 40 : w >= 640 ? 32 : 20,
  scale: w >= 768 ? 1 : w >= 380 ? 0.72 : Number(varOf(skyRoot, "sun-scale")),
  band: w >= 768 ? 50 : len(skyRoot, "sky-band"),
  arc: w >= 768 ? 10 : len(skyRoot, "sun-arc"),
  clearLeft: len(skyRoot, "chrome-left"),
  clearRight: w >= 640 ? 164 : len(skyRoot, "chrome-right"),
  // Measured in the browser: the wordmark is 93px wide at every size, the
  // switcher 144 on a phone and 160 from 640px up, and the first panel starts
  // at 78px on a phone and 94px above that.
  panelTop: w >= 768 ? 94 : 78,
  wordmark: 93,
  switcher: w >= 640 ? 160 : 144,
});

const skyMoods = ["dawn", "day", "dusk", "night"].map((id) => {
  const b = block(`[data-mood="${id}"] {`);
  return { id, x: Number(varOf(b, "sun-x")), y: Number(varOf(b, "sun-y")), size: len(b, "sun-size") };
});

let tightest = { slack: Infinity };
for (const w of [320, 360, 390, 414, 640, 768, 834, 1024, 1120, 1280, 1440, 1536, 1920, 2560]) {
  const g = atWidth(w);
  const edge = Math.max(0, (w - g.shell) / 2);
  for (const m of skyMoods) {
    const disc = m.size * g.scale;
    const r = disc / 2;
    const skyLeft = edge + g.pad + g.clearLeft + r;
    const skyRight = w - edge - g.pad - g.clearRight - r;
    const cx = skyLeft + m.x * (skyRight - skyLeft);
    const cy = g.band + m.y * g.arc;
    const checks = [
      ["clears the wordmark", cx - r - (edge + g.pad + g.wordmark)],
      ["clears the switcher", w - edge - g.pad - g.switcher - (cx + r)],
      ["clears the panel", g.panelTop - (cy + r)],
      ["stays below the top edge", cy - r],
    ];
    for (const [what, slack] of checks) {
      checks_sky++;
      if (slack < tightest.slack) tightest = { slack, what, w, mood: m.id };
      if (slack < 0) {
        failures.push(`${w}px ${m.id}: celestial body ${what} by ${slack.toFixed(1)}px short`);
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * Palette discipline
 *
 * The accents are a designed family, not colours picked one at a time. An
 * earlier version of this palette was 13 of 24 stock framework values — this
 * keeps it from drifting back.
 * ------------------------------------------------------------------ */
const TAILWIND = new Set([
  "#a78bfa", "#7dd3fc", "#facc15", "#38bdf8", "#fb923c", "#f43f5e", "#22d3ee",
  "#818cf8", "#c084fc", "#fbbf24", "#f472b6", "#a5b4fc", "#f0abfc", "#64748b",
  "#bae6fd", "#fdba74", "#dbeafe", "#1e3a8a", "#0e7490", "#4338ca", "#34d399",
  "#60a5fa", "#e879f9", "#f87171", "#4ade80", "#2dd4bf",
]);

const arc = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

const accents = moods.map((m) => ({ id: m.id, a: toOklch(m.accent), b: toOklch(m.accent2) }));
const Ls = accents.flatMap((x) => [x.a.L, x.b.L]);
const Cs = accents.flatMap((x) => [x.a.C, x.b.C]);
const spreadL = Math.max(...Ls) - Math.min(...Ls);
const spreadC = Math.max(...Cs) - Math.min(...Cs);

if (spreadL > 0.14) failures.push(`palette: accent lightness spread ${spreadL.toFixed(2)} — not one family (max 0.14)`);
if (spreadC > 0.05) failures.push(`palette: accent chroma spread ${spreadC.toFixed(3)} — not one family (max 0.05)`);

for (const x of accents) {
  const gap = arc(x.a.H, x.b.H);
  if (gap < 45) failures.push(`palette: ${x.id} pair only ${Math.round(gap)}deg apart — the gradient barely travels`);
  // Accents must carry far more chroma than body text, or they read as
  // differently-coloured text rather than emphasis.
  for (const [role, c] of [["accent", x.a], ["accent-2", x.b]]) {
    if (c.C < 0.09) failures.push(`palette: ${x.id} ${role} chroma ${c.C.toFixed(3)} too low to read as an accent`);
  }
}

// Accent hues must stay distinct across moods — and that means EVERY accent
// against every other mood's, not just the primaries. Comparing only primary
// to primary missed that dawn and night were the same two hues swapped: dawn's
// accent sat 3deg from night's accent-2 and dawn's accent-2 8deg from night's
// accent, so the headline gradient, which uses both, looked identical at dawn
// and at midnight.
let closestAccents = { gap: Infinity };
for (let i = 0; i < accents.length; i++) {
  for (let j = i + 1; j < accents.length; j++) {
    for (const [ra, ca] of [["accent", accents[i].a], ["accent-2", accents[i].b]]) {
      for (const [rb, cb] of [["accent", accents[j].a], ["accent-2", accents[j].b]]) {
        const gap = arc(ca.H, cb.H);
        if (gap < closestAccents.gap) {
          closestAccents = { gap, a: `${accents[i].id}/${ra}`, b: `${accents[j].id}/${rb}` };
        }
        if (gap < 30) {
          failures.push(
            `palette: ${accents[i].id}/${ra} and ${accents[j].id}/${rb} only ${Math.round(gap)}deg apart ` +
            `— those two moods will read the same`,
          );
        }
      }
    }
  }
}

// `longer hue` sends an oklch gradient the long way round the wheel, so it
// sweeps every hue on the circle no matter which two colours it was given.
// The headline used it and looked like the same rainbow in every mood, which
// is what made dawn and midnight indistinguishable.
// Comments are stripped first: the note explaining this rule says "longer hue"
// itself, and a greedy match swallowed the declaration into the comment.
const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
const longHue = [...cssNoComments.matchAll(/([^;{}]*\blonger hue\b[^;{}]*)/g)].map((m) => m[1].trim());
if (longHue.length) {
  failures.push(
    `palette: ${longHue.length} gradient(s) use \`longer hue\`, which ignores the accents ` +
    `and sweeps the whole wheel — ${longHue[0].slice(0, 60)}`,
  );
}

// Nothing straight out of a framework.
const hexes = css.match(/#[0-9a-fA-F]{6}/g) ?? [];
const stock = [...new Set(hexes.map((h) => h.toLowerCase()))].filter((h) => TAILWIND.has(h));
if (stock.length) failures.push(`palette: ${stock.length} stock framework colour(s) in use — ${stock.join(", ")}`);

console.log(`palette gate: lightness spread ${spreadL.toFixed(2)}, chroma spread ${spreadC.toFixed(3)}, ` +
  `pair arcs ${accents.map((x) => Math.round(arc(x.a.H, x.b.H))).join("/")}deg, no stock values`);
console.log(
  `  closest accents across moods: ${closestAccents.a} vs ${closestAccents.b}, ` +
  `${Math.round(closestAccents.gap)}deg apart`,
);
console.log(
  `contrast gate: ${checks} checks across ${moods.length} moods x ${seasons.length} seasons`,
);
console.log(
  `  faintest particles: ${worstFall.season} at ${worstFall.mood}, ${worstFall.r.toFixed(2)} vs sky`,
);
console.log(
  `sky geometry: ${checks_sky} checks; tightest is ${tightest.mood} at ${tightest.w}px — ` +
  `${tightest.what}, ${tightest.slack.toFixed(1)}px to spare`,
);
for (const [name, th] of Object.entries(themes)) {
  console.log(`  ${name}: panel alpha ${th.panelA}, tile alpha ${th.tileA}`);
}
if (failures.length) {
  console.log(`\n${failures.length} FAILURES`);
  failures.forEach((f) => console.log("  ✗ " + f));
  process.exit(1);
}
console.log("\nall pass at AA");
