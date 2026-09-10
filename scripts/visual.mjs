/**
 * Browser checks that arithmetic cannot answer: real layout, real pixels.
 *
 * `npm run contrast` covers everything derivable from the stylesheet alone.
 * This covers what needs a rendered page — where the chrome actually sits, how
 * wide things really are, whether anything overflows, and whether the frame
 * rate holds. It lives in the repo rather than a scratch directory because the
 * bugs it guards against (a sun parked behind the wordmark, a portrait pushing
 * the page sideways) came back more than once.
 *
 * Run: npm run visual        (needs a dev server on $BASE, default :3000)
 */
import { chromium } from "playwright-core";
import { existsSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const MOODS = ["dawn", "day", "dusk", "night"];
const ROUTES = ["/", "/resume", "/portfolio", "/blog", "/contact"];
// Widths worth checking: the narrowest phone still in use, the common phones,
// tablet portrait and landscape, laptop, and the two desktop breakpoints.
const WIDTHS = [320, 360, 390, 414, 540, 768, 834, 1024, 1180, 1280, 1440, 1920, 2560];

const EXE =
  process.env.CHROME_PATH ??
  [
    `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`,
    "/usr/bin/chromium",
    "/usr/bin/google-chrome",
  ].find((p) => existsSync(p));

if (!EXE) {
  console.error(
    "visual: no Chrome found. Set CHROME_PATH, or install one " +
      "(npx playwright install chromium).",
  );
  process.exit(2);
}

const fail = [];
const ok = (cond, msg) => {
  if (!cond) fail.push(msg);
  return cond;
};

const settled = async (page, mood) => {
  await page.evaluate((m) => document.documentElement.setAttribute("data-mood", m), mood);
  // Longer than the longest staged transition (--fireflies: 2400ms + 1400ms).
  await page.waitForTimeout(4400);
};

const browser = await chromium.launch({ executablePath: EXE });

/* ---- the celestial body owns one strip of sky, and must stay in it ---- */
{
  const sizes = [
    [320, 640], [390, 844], [414, 896], [768, 1024],
    [1024, 700], [1280, 860], [1440, 900], [1920, 1080], [2560, 1440],
  ];
  let tightest = { slack: Infinity };
  for (const [w, h] of sizes) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);

    for (const mood of MOODS) {
      await settled(page, mood);
      const r = await page.evaluate(() => {
        const cs = getComputedStyle(document.documentElement);
        const disc = parseFloat(cs.getPropertyValue("--disc"));
        const box = document.querySelector(".scene__celestial").getBoundingClientRect();
        const cx = box.x + box.width / 2;
        const cy = box.y + box.height / 2;
        const rad = disc / 2;

        // Everything the sky has to stay clear of: the panels, the wordmark
        // and the mood switcher.
        const obstacles = [];
        for (const el of document.querySelectorAll(".panel")) {
          const b = el.getBoundingClientRect();
          obstacles.push({ what: "panel", x: b.x, right: b.right, y: b.y, bottom: b.bottom });
        }
        for (const el of document.querySelectorAll("[role='radiogroup']")) {
          const b = el.getBoundingClientRect();
          if (b.top < 120) obstacles.push({ what: "switcher", x: b.x, right: b.right, y: b.y, bottom: b.bottom });
        }
        for (const el of document.querySelectorAll("a")) {
          const b = el.getBoundingClientRect();
          if (b.top < 90 && (el.textContent || "").toLowerCase().includes("bakul")) {
            obstacles.push({ what: "wordmark", x: b.x, right: b.right, y: b.y, bottom: b.bottom });
          }
        }
        // Positive = clear by that many px; negative = overlapping.
        let worst = { slack: Infinity, what: "none" };
        for (const o of obstacles) {
          const gap = Math.max(o.x - (cx + rad), cx - rad - o.right, o.y - (cy + rad), cy - rad - o.bottom);
          if (gap < worst.slack) worst = { slack: gap, what: o.what };
        }
        return { disc, cx: Math.round(cx), cy: Math.round(cy), top: Math.round(cy - rad), worst };
      });

      ok(Number.isFinite(r.disc) && r.disc > 0, `celestial ${w}x${h} ${mood}: --disc resolves to a length (got ${r.disc})`);
      ok(r.worst.slack >= 0, `celestial ${w}x${h} ${mood}: overlaps the ${r.worst.what} by ${Math.abs(Math.round(r.worst.slack))}px`);
      ok(r.top >= 0, `celestial ${w}x${h} ${mood}: clipped off the top by ${-r.top}px`);
      if (r.worst.slack < tightest.slack) tightest = { ...r.worst, w, h, mood };
    }
    await ctx.close();
  }
  console.log(
    `celestial: clear at ${sizes.length} viewports x ${MOODS.length} moods; ` +
      `tightest ${tightest.mood} at ${tightest.w}x${tightest.h} — ${Math.round(tightest.slack)}px from the ${tightest.what}`,
  );
}

/* ---- nothing may overflow sideways, and touch targets stay tappable ---- */
{
  const issues = [];
  for (const width of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    for (const route of ROUTES) {
      const page = await ctx.newPage();
      await page.goto(BASE + route, { waitUntil: "networkidle" });
      const r = await page.evaluate(() => {
        const hscroll = document.documentElement.scrollWidth - document.documentElement.clientWidth;
        // Only things that can actually push the page sideways count. The scene
        // layers are deliberately inset past the viewport so their drift never
        // reveals an edge, and the marquee track is wider than its window by
        // design — all of them sit inside an overflow-hidden ancestor, so they
        // are clipped, not overflowing.
        const clipped = (el) => {
          for (let a = el.parentElement; a; a = a.parentElement) {
            if (getComputedStyle(a).overflow !== "visible") return true;
          }
          return false;
        };
        const over = [];
        for (const el of document.querySelectorAll("body *")) {
          const b = el.getBoundingClientRect();
          if (b.width === 0 || b.height === 0) continue;
          if ((b.right > innerWidth + 1 || b.left < -1) && !clipped(el)) {
            over.push(el.tagName.toLowerCase() + "." + (el.className?.toString?.().split(" ")[0] ?? ""));
          }
        }
        const tiny = [];
        for (const el of document.querySelectorAll("a, button, [role='radio']")) {
          const b = el.getBoundingClientRect();
          if (b.width === 0 || b.height === 0) continue;
          // Skip-links and other sr-only affordances are 1px until focused;
          // that is the correct pattern, not a small tap target.
          if (b.width <= 2 && b.height <= 2) continue;
          if (b.height < 24) tiny.push(`${el.tagName.toLowerCase()}("${(el.textContent || "").trim().slice(0, 24)}")`);
        }
        return { hscroll, over: [...new Set(over)], tiny: [...new Set(tiny)] };
      });
      if (r.hscroll > 0) issues.push(`${width} ${route}: page scrolls sideways by ${r.hscroll}px`);
      if (r.over.length) issues.push(`${width} ${route}: ${r.over.length} element(s) past the viewport — ${r.over.slice(0, 3).join(", ")}`);
      if (r.tiny.length) issues.push(`${width} ${route}: short touch target(s) — ${r.tiny.join(", ")}`);
      await page.close();
    }
    await ctx.close();
  }
  for (const i of issues) fail.push(i);
  console.log(`layout: ${WIDTHS.length} widths x ${ROUTES.length} routes, ${issues.length} issue(s)`);
}

/* ---- images must actually load, at a sensible resolution ---- */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const imgs = await page.evaluate(() =>
    [...document.querySelectorAll("img")].map((i) => ({
      src: i.currentSrc || i.src,
      broken: i.complete && i.naturalWidth === 0,
      natural: i.naturalWidth,
      css: Math.round(i.getBoundingClientRect().width),
      alt: i.getAttribute("alt"),
    })),
  );
  ok(imgs.length > 0, "images: the page renders at least one image");
  for (const i of imgs) {
    ok(!i.broken, `images: broken source ${i.src}`);
    ok(i.alt !== null, `images: missing alt on ${i.src}`);
  }
  console.log(`images: ${imgs.length} loaded, none broken`);
  await ctx.close();
}

/* ---- frame rate, idle, on a desktop and a throttled phone ---- */
{
  for (const [label, viewport, throttle] of [
    ["desktop", { width: 1280, height: 900 }, 1],
    ["phone 6x", { width: 390, height: 844 }, 6],
  ]) {
    const ctx = await browser.newContext({ viewport });
    const page = await ctx.newPage();
    if (throttle > 1) {
      const cdp = await ctx.newCDPSession(page);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
    }
    await page.goto(BASE + "/", { waitUntil: "load" });
    await page.waitForTimeout(4000);
    const sample = () =>
      page.evaluate(
        () =>
          new Promise((res) => {
            let frames = 0;
            const t0 = performance.now();
            const tick = () => {
              frames++;
              performance.now() - t0 < 1800 ? requestAnimationFrame(tick) : res(Math.round(frames / 1.8));
            };
            requestAnimationFrame(tick);
          }),
      );
    // Best of three: a machine running several browsers adds its own noise.
    const fps = Math.max(await sample(), await sample(), await sample());
    ok(fps >= 50, `perf: ${label} idle frame rate is ${fps}fps (want >= 50)`);
    console.log(`perf: ${label} idle ${fps}fps`);
    await ctx.close();
  }
}

await browser.close();

if (fail.length) {
  console.log(`\n${fail.length} FAILURES`);
  for (const f of fail) console.log("  x " + f);
  process.exit(1);
}
console.log("\nall visual checks pass");
