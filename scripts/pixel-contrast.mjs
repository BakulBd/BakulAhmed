/**
 * Contrast measured on real pixels — every visible text node and UI icon on
 * every route, in every mood, on a phone and a desktop, against what is
 * actually rendered behind it.
 *
 * Run: npm run contrast:pixels     (needs a running server on $BASE, default :3000)
 *
 * npm run contrast checks the palette arithmetically; this checks what the
 * page does with it — opacity modifiers, glass over a moving sky, text on
 * cards on panels, gradient headlines. For each element it captures the page
 * twice, once as drawn and once with every glyph and icon made transparent
 * (text-shadows kept: a halo is part of what sits behind the letters), and
 * compares the element's colour with the worst tenth of the pixels under it.
 * Thresholds are WCAG's: 4.5:1 for text, 3:1 for large text and icons.
 * Decorative items (inside aria-hidden) are reported but marked as such.
 *
 * Report only: it prints the failures and near-misses and exits 0. Set
 * REPORT=path.json to keep every measurement.
 */
import { chromium } from "playwright-core";
import { existsSync, writeFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const EXE =
  process.env.CHROME_PATH ??
  ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/usr/bin/chromium", "/usr/bin/google-chrome"].find((p) => existsSync(p));
if (!EXE) {
  console.error("contrast:pixels: no Chrome found. Set CHROME_PATH.");
  process.exit(2);
}
const ROUTES = (process.env.ROUTES ?? "/,/resume,/portfolio,/blog,/contact,/blog/multiplayer-netcode-prediction-reconciliation").split(",");
const MOODS = (process.env.MOODS ?? "dawn,day,dusk,night").split(",");
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, mobile: false },
  { name: "phone", width: 390, height: 844, mobile: true },
];
const SEASON = process.env.SEASON ?? "summer";

const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const over = (fg, a, bg) => fg.map((c, i) => c * a + bg[i] * (1 - a));

const HIDE_GLYPHS = `
*, *::before, *::after { color: transparent !important; -webkit-text-fill-color: transparent !important;
  caret-color: transparent !important; text-decoration-color: transparent !important; }
.gradient-text { background: none !important; }
::placeholder { color: transparent !important; }
svg:not(.art) { visibility: hidden !important; }
.marquee__track { animation-play-state: paused !important; }`;
const STILL = `
[data-reveal] { animation: none !important; opacity: 1 !important; transform: none !important; transition: none !important; }
.route-enter, .rotator__item { animation: none !important; }
.section-title::after { animation: none !important; }
.marquee__track { animation-play-state: paused !important; }
.swiper__slide { transition: none !important; }`;

/** A PNG screenshot as raw RGBA, decoded by the browser itself (public APIs only). */
async function decode(page, png) {
  const { width, height, data } = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    // Base64 back to Node: far smaller than a JSON array of numbers.
    let bin = "";
    for (let i = 0; i < d.length; i += 0x8000) bin += String.fromCharCode.apply(null, d.subarray(i, i + 0x8000));
    return { width: c.width, height: c.height, data: btoa(bin) };
  }, png.toString("base64"));
  return { width, height, data: Buffer.from(data, "base64") };
}

const browser = await chromium.launch({
  executablePath: EXE,
  args: ["--disable-background-networking", "--disable-component-update"],
});
const results = [];

for (const vp of VIEWPORTS) {
  for (const mood of MOODS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
    });
    await ctx.addInitScript(([m, s]) => {
      localStorage.setItem("mood", m);
      localStorage.setItem("season", s);
    }, [mood, SEASON]);
    for (const route of ROUTES) {
      const page = await ctx.newPage();
      await page.goto(BASE + route, { waitUntil: "networkidle" });
      await page.addStyleTag({ content: STILL });
      await page.waitForTimeout(1200);
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      const seen = new Set();
      for (let y = 0; y < height; y += Math.round(vp.height * 0.8)) {
        await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
        await page.waitForTimeout(450);
        const items = await page.evaluate(() => {
          const cv = document.createElement("canvas");
          cv.width = cv.height = 1;
          const g = cv.getContext("2d", { willReadFrequently: true });
          const rgba = (css) => {
            g.clearRect(0, 0, 1, 1);
            g.fillStyle = "#000";
            g.fillStyle = css;
            g.fillRect(0, 0, 1, 1);
            const d = g.getImageData(0, 0, 1, 1).data;
            return [d[0], d[1], d[2], d[3] / 255];
          };
          const opacityChain = (el) => {
            let o = 1;
            for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= Number(getComputedStyle(e).opacity);
            return o;
          };
          const describe = (el) => {
            const cls = (el.getAttribute("class") || "").split(/\s+/).filter(Boolean).slice(0, 3).join(".");
            const txt = (el.textContent || el.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 40);
            return `${el.tagName.toLowerCase()}${cls ? "." + cls : ""} "${txt}"`;
          };
          const visibleTop = (el, r) => {
            const pts = [
              [r.left + r.width / 2, r.top + r.height / 2],
              [r.left + 2, r.top + r.height / 2],
              [r.right - 2, r.top + r.height / 2],
            ];
            return pts.every(([x, y]) => {
              const hit = document.elementFromPoint(x, y);
              return hit && (hit === el || el.contains(hit) || hit.contains(el));
            });
          };
          const out = [];
          let id = Number(document.body.dataset.auditNext || 0);
          const consider = (el, kind, r) => {
            if (r.width < 2 || r.height < 2) return;
            if (r.top < 0 || r.bottom > innerHeight || r.left < 0 || r.right > innerWidth) return;
            for (let a = el.parentElement; a; a = a.parentElement) {
              const o = getComputedStyle(a);
              if (o.overflowX !== "visible" || o.overflowY !== "visible") {
                const b = a.getBoundingClientRect();
                if (r.left < b.left - 1 || r.right > b.right + 1 || r.top < b.top - 1 || r.bottom > b.bottom + 1) return;
              }
            }
            const cs = getComputedStyle(el);
            if (cs.visibility !== "visible") return;
            const alpha = opacityChain(el);
            if (alpha < 0.05) return;
            if (!visibleTop(el, r)) return;
            if (!el.dataset.auditId) el.dataset.auditId = String(id++);
            let gradient = false;
            for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
              const s = getComputedStyle(e);
              if (s.backgroundClip === "text" || s.webkitBackgroundClip === "text") gradient = true;
            }
            const empty = kind === "field" && !el.value;
            const c = rgba(empty ? getComputedStyle(el, "::placeholder").color : cs.color);
            if (empty) {
              const ph = getComputedStyle(el, "::placeholder");
              c[3] *= Number(ph.opacity || 1);
            }
            out.push({
              id: el.dataset.auditId,
              kind,
              desc: describe(el),
              rect: { x: Math.floor(r.left), y: Math.floor(r.top), w: Math.ceil(r.width), h: Math.ceil(r.height) },
              color: c,
              alpha: alpha * c[3],
              size: parseFloat(cs.fontSize),
              weight: Number(cs.fontWeight),
              gradient,
              ariaHidden: !!el.closest("[aria-hidden=true]"),
            });
          };
          // Text: every element with its own non-empty text node.
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          const done = new Set();
          for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            if (!n.textContent.trim()) continue;
            const el = n.parentElement;
            if (!el || done.has(el) || el.closest("script,style,noscript,svg,.sr-only,[hidden]")) continue;
            done.add(el);
            const range = document.createRange();
            range.selectNodeContents(n);
            const r = range.getBoundingClientRect();
            consider(el, "text", r);
          }
          // Inputs' placeholders and values.
          for (const el of document.querySelectorAll("input:not([type=hidden]),textarea")) {
            const r = el.getBoundingClientRect();
            if (r.width && r.height && !el.closest("[aria-hidden=true]")) consider(el, "field", r);
          }
          // UI icons (not project art).
          for (const svg of document.querySelectorAll("svg:not(.art)")) {
            if (svg.closest(".art, .swiper")) continue;
            const r = svg.getBoundingClientRect();
            if (r.width < 8) continue;
            consider(svg, "icon", r);
          }
          document.body.dataset.auditNext = String(id);
          return out;
        });
        const fresh = items.filter((i) => !seen.has(i.id));
        if (!fresh.length) continue;
        fresh.forEach((i) => seen.add(i.id));
        const withGlyphs = await decode(page, await page.screenshot());
        const style = await page.addStyleTag({ content: HIDE_GLYPHS });
        await page.waitForTimeout(80);
        const bare = await decode(page, await page.screenshot());
        await style.evaluate((n) => n.remove());
        const px = (img, x, y) => {
          const k = (y * img.width + x) * 4;
          return [img.data[k], img.data[k + 1], img.data[k + 2]];
        };
        for (const it of fresh) {
          const { x, y, w, h } = it.rect;
          const bgs = [];
          const inks = [];
          for (let yy = y; yy < y + h; yy++) {
            for (let xx = x; xx < x + w; xx++) {
              const b = px(bare, xx, yy);
              const a = px(withGlyphs, xx, yy);
              bgs.push(b);
              const d = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
              inks.push([d, a, b]);
            }
          }
          // The background a reader sees: the lightest decile for dark text, the
          // darkest for light — i.e. the worst case under the glyphs, not the mean.
          const lumOf = (p) => lum(p);
          bgs.sort((p, q) => lumOf(p) - lumOf(q));
          const mid = bgs[Math.floor(bgs.length / 2)];
          let fg;
          let measured;
          if (it.gradient) {
            // Gradient text (and field contents): read the ink itself — glyph
            // cores, the pixels that changed most — and take the weakest tenth.
            const maxd = Math.max(...inks.map((i) => i[0]));
            const core = inks.filter((i) => i[0] > maxd * 0.7);
            const rs = core.map(([, a, b]) => ratio(a, b)).sort((p, q) => p - q);
            measured = rs[Math.floor(rs.length * 0.1)] ?? 1;
          } else {
            fg = over(it.color.slice(0, 3), it.alpha, mid);
            const lightText = lum(fg) > lum(mid);
            const worstBg = lightText ? bgs[Math.floor(bgs.length * 0.9)] : bgs[Math.floor(bgs.length * 0.1)];
            measured = Math.min(ratio(over(it.color.slice(0, 3), it.alpha, worstBg), worstBg), ratio(fg, mid));
          }
          const large = it.size >= 24 || (it.size >= 18.66 && it.weight >= 700);
          const need = it.kind === "icon" ? 3 : large ? 3 : 4.5;
          results.push({
            vp: vp.name,
            mood,
            route,
            kind: it.kind,
            desc: it.desc,
            ratio: Math.round(measured * 100) / 100,
            need,
            size: it.size,
            ariaHidden: it.ariaHidden,
            bg: mid.map((c) => Math.round(c)),
          });
        }
      }
      await page.close();
    }
    await ctx.close();
  }
}
await browser.close();
if (process.env.REPORT) writeFileSync(process.env.REPORT, JSON.stringify(results));
summarise(results);

function summarise(r) {
console.log(`measured ${r.length} element renders (${r.filter((x) => x.kind === "text").length} text, ${r.filter((x) => x.kind === "icon").length} icons, ${r.filter((x) => x.kind === "field").length} fields)`);
// Worst render of each distinct element description.
const worst = new Map();
for (const x of r) {
  const key = `${x.kind}|${x.desc.replace(/"[^"]*"/, (m) => m.slice(0, 22))}`;
  const score = x.ratio / x.need;
  if (!worst.has(key) || score < worst.get(key).score) worst.set(key, { ...x, score });
}
const rows = [...worst.values()].sort((a, b) => a.score - b.score);
const fail = rows.filter((x) => x.score < 1);
const near = rows.filter((x) => x.score >= 1 && x.score < 1.12);
const fmt = (x) => `${x.ratio.toFixed(2).padStart(6)}/${x.need} ${x.ariaHidden ? "[decorative] " : ""}${x.vp} ${x.mood} ${x.route} ${x.kind} ${x.desc}`;
console.log(`\nBELOW THRESHOLD (${fail.length}):`);
fail.forEach((x) => console.log("  " + fmt(x)));
console.log(`\nWITHIN 12% OF THRESHOLD (${near.length}):`);
near.forEach((x) => console.log("  " + fmt(x)));
const all = r.map((x) => x.ratio / x.need);
console.log(`\npass rate: ${((all.filter((s) => s >= 1).length / all.length) * 100).toFixed(2)}% of renders`);
const pct = (k) => {
  const xs = r.filter((x) => x.kind === k).map((x) => x.ratio).sort((a, b) => a - b);
  return xs.length ? `${k}: min ${xs[0]}, p10 ${xs[Math.floor(xs.length * 0.1)]}, median ${xs[Math.floor(xs.length / 2)]}` : "";
};
console.log(pct("text"));
console.log(pct("icon"));
}
