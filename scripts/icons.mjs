/**
 * The site's icons, drawn once and rendered to every size a platform asks for.
 *
 * Run: npm run icons     (needs Chrome — set CHROME_PATH if it is not found)
 *
 * The mark is the wordmark reduced to its initial: "B." — the real Geist Bold
 * B (its outline lifted from assets/fonts/Geist-Bold.ttf, so it is the same
 * letter the page sets) and the accent full stop that ends "Bakul Ahmed." in
 * the header. At tab size that is all there is room for. From 180px up the
 * icon also carries the site's night: a sky deepening to the zenith, a few
 * stars, a low glow at the horizon and the city along the bottom — the same
 * skyline the page draws (lib/skyline-art.json), mosque and minarets included.
 *
 * Writes:
 *   app/icon.svg               the favicon modern browsers use (any size)
 *   app/favicon.ico            16, 32 and 48px, for everything else
 *   app/apple-icon.png         180px, full-bleed (iOS rounds it itself)
 *   public/icons/icon-192.png  manifest, rounded
 *   public/icons/icon-512.png  manifest, rounded
 *   public/icons/maskable-512.png  manifest, full-bleed, mark in the safe zone
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright-core";

const sky = JSON.parse(readFileSync(new URL("../lib/skyline-art.json", import.meta.url), "utf8"));

/** Geist Bold "B", normalised to 100 units tall, 81.4 wide, origin top-left. */
const B =
  "M0 100L0 0L38.87 0Q57.46 0 67.32 6.55Q77.18 13.1 77.18 27.18Q77.18 33.38 74.64 37.96Q72.11 42.54 67.25 45.21" +
  "Q62.39 47.89 55.49 48.45L55.49 48.17Q68.02 49.01 74.71 55.42Q81.4 61.83 81.4 72.39Q81.4 86.34 71.62 93.17" +
  "Q61.83 100 43.66 100L0 100ZM21.4 82.54L42.67 82.54Q50.42 82.54 55.14 79.37Q59.85 76.2 59.85 69.86" +
  "Q59.85 63.52 55.14 60.21Q50.42 56.9 42.67 56.9L21.4 56.9L21.4 82.54ZM21.4 41.41L38.31 41.41" +
  "Q46.19 41.41 50.91 38.31Q55.63 35.21 55.63 29.44Q55.63 23.24 51.05 20.35Q46.47 17.46 38.31 17.46L21.4 17.46L21.4 41.41Z";
const B_W = 81.4;

// The night mood — the site's default sky and its accent pair.
const FG = "#f7f8fb";
const ACCENT = "#75e7bf";
const ACCENT_2 = "#87bafe";

/** "B." centred on (cx, cy), the letter `h` tall. */
function mark(cx, cy, h) {
  const s = h / 100;
  const gap = h * 0.1;
  const r = h * 0.145;
  const w = B_W * s + gap + 2 * r;
  const x = cx - w / 2;
  const y = cy - h / 2;
  const dx = x + B_W * s + gap + r;
  const dy = y + h - r;
  return (
    `<path d="${B}" transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s.toFixed(4)})" fill="${FG}"/>` +
    `<circle cx="${dx.toFixed(2)}" cy="${dy.toFixed(2)}" r="${(r * 2.1).toFixed(2)}" fill="url(#halo)"/>` +
    `<circle cx="${dx.toFixed(2)}" cy="${dy.toFixed(2)}" r="${r.toFixed(2)}" fill="url(#dot)"/>`
  );
}

const defs = (size) =>
  `<defs>` +
  `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1628"/><stop offset=".62" stop-color="#060c18"/><stop offset="1" stop-color="#03070f"/></linearGradient>` +
  `<radialGradient id="horizon" cx=".5" cy="1.08" r=".62"><stop offset="0" stop-color="${ACCENT}" stop-opacity=".2"/><stop offset=".55" stop-color="#233869" stop-opacity=".16"/><stop offset="1" stop-color="#233869" stop-opacity="0"/></radialGradient>` +
  `<linearGradient id="dot" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${ACCENT}"/><stop offset="1" stop-color="${ACCENT_2}"/></linearGradient>` +
  `<radialGradient id="halo"><stop offset="0" stop-color="${ACCENT}" stop-opacity=".45"/><stop offset="1" stop-color="${ACCENT}" stop-opacity="0"/></radialGradient>` +
  `<linearGradient id="edge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".5" stop-color="#fff" stop-opacity=".04"/><stop offset="1" stop-color="#fff" stop-opacity=".02"/></linearGradient>` +
  `<clipPath id="tile"><rect width="${size}" height="${size}" rx="${size * 0.22}"/></clipPath>` +
  `</defs>`;

/** Deterministic stars in the upper sky. */
function stars(size) {
  let seed = 19;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  let out = "";
  for (let i = 0; i < 22; i++) {
    const x = rand() * size;
    const y = rand() * size * 0.5;
    const r = (0.4 + rand() * 0.9) * (size / 512) * 1.6;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#fff" opacity="${(0.25 + rand() * 0.6).toFixed(2)}"/>`;
  }
  return out;
}

/** The city along the bottom: the near plane, cropped around the mosque. */
function city(size) {
  const s = (size / 512) * 0.46;
  const crop = 440;
  const H = sky.near.h;
  const y = size - H * s;
  return (
    `<g transform="translate(${(-crop * s * 0.6).toFixed(2)} ${(size - sky.far.h * s * 0.95 - size * 0.035).toFixed(2)}) scale(${(s * 0.95).toFixed(4)})" opacity=".55"><path d="${sky.far.d}" fill="#152238"/></g>` +
    `<g transform="translate(${(-crop * s).toFixed(2)} ${y.toFixed(2)}) scale(${s.toFixed(4)})">` +
    `<path d="${sky.near.d}" fill="#02050b"/>` +
    `<path d="${sky.near.d}" fill="none" stroke="${ACCENT}" stroke-opacity=".28" stroke-width="${(1.2 / s).toFixed(2)}"/>` +
    `<g fill="#fbd094" opacity=".9">${sky.near.windows}</g>` +
    `</g>`
  );
}

/** Rich icon: rounded (manifest "any") or full-bleed (maskable, iOS). */
function rich(size, { rounded, markScale }) {
  const body =
    `<rect width="${size}" height="${size}" fill="url(#bg)"/>` +
    `<rect width="${size}" height="${size}" fill="url(#horizon)"/>` +
    stars(size) +
    city(size) +
    mark(size / 2, size * 0.45, size * markScale);
  const edge = rounded
    ? `<rect x=".75" y=".75" width="${size - 1.5}" height="${size - 1.5}" rx="${size * 0.22 - 0.75}" fill="none" stroke="url(#edge)" stroke-width="1.5"/>`
    : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    defs(size) +
    (rounded ? `<g clip-path="url(#tile)">${body}</g>${edge}` : body) +
    `</svg>`
  );
}

/** The favicon: at 16-48px there is room for the mark and the light, no city. */
const favicon =
  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">` +
  defs(32) +
  `<rect width="32" height="32" rx="7.5" fill="url(#bg)"/>` +
  `<rect width="32" height="32" rx="7.5" fill="url(#horizon)"/>` +
  `<rect x=".5" y=".5" width="31" height="31" rx="7" fill="none" stroke="url(#edge)"/>` +
  mark(16, 16, 15.5) +
  `</svg>`;

/* ---------------- render ---------------- */
const EXE =
  process.env.CHROME_PATH ??
  ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/usr/bin/chromium", "/usr/bin/google-chrome"].find((p) =>
    existsSync(p),
  );
if (!EXE) {
  console.error("icons: no Chrome found. Set CHROME_PATH.");
  process.exit(2);
}
const browser = await chromium.launch({ executablePath: EXE });
const page = await browser.newPage({ deviceScaleFactor: 1 });
const png = async (svg, size) => {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
  );
  return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
};

const root = (p) => new URL(`../${p}`, import.meta.url);
writeFileSync(root("app/icon.svg"), favicon + "\n");
writeFileSync(root("public/icons/icon-192.png"), await png(rich(192, { rounded: true, markScale: 0.38 }), 192));
writeFileSync(root("public/icons/icon-512.png"), await png(rich(512, { rounded: true, markScale: 0.38 }), 512));
writeFileSync(root("public/icons/maskable-512.png"), await png(rich(512, { rounded: false, markScale: 0.3 }), 512));
writeFileSync(root("app/apple-icon.png"), await png(rich(180, { rounded: false, markScale: 0.36 }), 180));

// favicon.ico: PNG-compressed entries at 16, 32 and 48 (every current
// browser and Windows reads PNG inside ICO).
const sizes = [16, 32, 48];
const images = [];
for (const s of sizes) images.push(await png(favicon.replace('width="32" height="32"', `width="${s}" height="${s}"`), s));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = 6 + 16 * sizes.length;
const entries = sizes.map((s, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(s, 0);
  e.writeUInt8(s, 1);
  e.writeUInt8(0, 2);
  e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(images[i].length, 8);
  e.writeUInt32LE(offset, 12);
  offset += images[i].length;
  return e;
});
writeFileSync(root("app/favicon.ico"), Buffer.concat([header, ...entries, ...images]));

await browser.close();
console.log("icons: icon.svg, favicon.ico (16/32/48), apple-icon.png, icon-192, icon-512, maskable-512");
