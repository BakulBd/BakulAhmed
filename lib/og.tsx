import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { deflateSync } from "node:zlib";
import { ImageResponse } from "next/og";
import { profile, site } from "@/lib/content";
import { SKY_CORE } from "@/lib/mood";
import skylineArt from "@/lib/skyline-art.json";

export const OG_SIZE = { width: 1200, height: 630 };

// The night mood — the site's default sky and its accent pair.
const SKY_A = "#030810";
const SKY_B = "#101926";
const ACCENT = "#75e7bf";
const ACCENT_2 = "#87bafe";
const FG = "#f7f8fb";
const SOFT = "#d2d6e1";
const MUTED = "#a7acbd";
const WINDOW = "#fbd094";

const domain = new URL(site.url).host;

/* ------------------------------------------------------------------ *
 * The moon, rendered by the site's own renderer
 *
 * The sky clock in lib/mood.ts draws the moon per pixel into anything that
 * looks like a canvas. Here that is a stand-in that keeps the pixels, which
 * are then written out as a PNG — so the card's moon is the same moon the
 * site draws, not a second drawing of it. A fixed waxing gibbous keeps every
 * card the same from build to build.
 * ------------------------------------------------------------------ */
const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf: Buffer) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type: string, data: Buffer) => {
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};
function png(width: number, height: number, rgba: Uint8ClampedArray) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 6, 0, 0, 0], 8); // 8-bit RGBA
  const rows = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    rows[y * (width * 4 + 1)] = 0;
    rows.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * (width * 4 + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function renderMoon(size: number) {
  const sky = new Function(`return ${SKY_CORE}`)();
  let pixels: Uint8ClampedArray | null = null;
  const canvas = {
    width: size,
    height: size,
    getContext: () => ({
      createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
      putImageData: (img: { data: Uint8ClampedArray }) => (pixels = img.data),
    }),
  };
  sky.drawMoon(canvas, new Date("2026-10-22T15:00:00Z"));
  return `data:image/png;base64,${png(size, size, pixels ?? new Uint8ClampedArray(size * size * 4)).toString("base64")}`;
}

/* ------------------------------------------------------------------ *
 * The skyline: the site's own city at night (scripts/skyline.mjs, via
 * lib/skyline-art.json) — the hazy far plane, then the near one with its
 * mosque and minarets, rooftops catching the light and windows lit. The same
 * shapes the page draws, so a shared link shows the place the site does.
 * ------------------------------------------------------------------ */
function skyline() {
  const H = 132;
  const hills =
    "M0 132V70C120 44 210 58 300 66S470 34 560 46 730 76 820 60 1010 30 1100 48 1200 62 1200 62V132Z";
  const plane = (p: { w: number; h: number; d: string }, scale: number, offset: number, body: (d: string) => string) => {
    const tiles: string[] = [];
    const w = p.w * scale;
    for (let x = -offset * scale; x < 1200; x += w) {
      tiles.push(`<g transform="translate(${x.toFixed(1)} ${(H - p.h * scale).toFixed(1)}) scale(${scale})">${body(p.d)}</g>`);
    }
    return tiles.join("");
  };
  const near = skylineArt.near;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${H}" viewBox="0 0 1200 ${H}">` +
    `<path d="${hills}" fill="#0a1322"/>` +
    plane(skylineArt.far, 0.46, 200, (d) => `<path d="${d}" fill="#0d1829" opacity="0.9"/>`) +
    `<rect y="${H - 54}" width="1200" height="54" fill="url(#haze)"/>` +
    plane(skylineArt.mid, 0.48, 380, (d) => `<path d="${d}" fill="#070d18"/>`) +
    plane(
      near,
      0.52,
      300,
      (d) =>
        `<path d="${d}" fill="#04070d"/>` +
        `<path d="${d}" fill="none" stroke="${ACCENT}" stroke-opacity="0.3" stroke-width="2.4"/>` +
        `<g fill="${WINDOW}">${near.windows}</g>`,
    ) +
    `<defs><linearGradient id="haze" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#1b2b48" stop-opacity="0"/><stop offset=".5" stop-color="#1b2b48" stop-opacity=".55"/><stop offset="1" stop-color="#1b2b48" stop-opacity="0"/></linearGradient></defs>` +
    `</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/* ------------------------------------------------------------------ *
 * Assets: read once per build and shared by every card.
 * ------------------------------------------------------------------ */
type Assets = {
  regular: Buffer;
  bold: Buffer;
  portrait: string;
  moon: string;
  skyline: string;
  art: Record<string, string>;
};
let assets: Promise<Assets> | undefined;
function loadAssets() {
  assets ??= (async () => {
    const root = process.cwd();
    const artFiles = ["web-game", "epistemic-guard", "green-guardian"];
    const [regular, bold, photo, ...art] = await Promise.all([
      readFile(join(root, "assets/fonts/Geist-Regular.ttf")),
      readFile(join(root, "assets/fonts/Geist-Bold.ttf")),
      readFile(join(root, "public", profile.image.src)),
      ...artFiles.map((f) => readFile(join(root, "public/work", `${f}.svg`))),
    ]);
    return {
      regular,
      bold,
      portrait: `data:image/jpeg;base64,${photo.toString("base64")}`,
      moon: renderMoon(160),
      skyline: skyline(),
      art: Object.fromEntries(
        artFiles.map((f, i) => [`/work/${f}.svg`, `data:image/svg+xml;base64,${art[i].toString("base64")}`]),
      ),
    };
  })();
  return assets;
}

const titleSize = (title: string, width: "wide" | "half") =>
  width === "wide"
    ? title.length <= 28 ? 76 : title.length <= 52 ? 64 : 54
    : title.length <= 28 ? 66 : title.length <= 48 ? 56 : 48;

/* ------------------------------------------------------------------ *
 * Pieces
 *
 * Everything absolutely positioned is placed by `left`: in Satori, `right`
 * on an absolute child was ignored and the element landed at the left edge,
 * on top of the title.
 * ------------------------------------------------------------------ */
function Label({ text }: { text: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "9px 18px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(30,33,45,0.72)",
        fontSize: 20,
        letterSpacing: 2.5,
        color: SOFT,
      }}
    >
      <div style={{ width: 10, height: 10, borderRadius: 999, background: ACCENT }} />
      {text.toUpperCase()}
    </div>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, width: 688 }}>
      {items.map((c, i) => (
        <div
          key={c}
          style={{
            display: "flex",
            padding: "10px 18px",
            borderRadius: 14,
            border: `1px solid ${i === 0 ? "rgba(117,231,191,0.45)" : "rgba(255,255,255,0.13)"}`,
            background: i === 0 ? "rgba(117,231,191,0.12)" : "rgba(30,33,45,0.75)",
            fontSize: 22,
            color: i === 0 ? ACCENT : SOFT,
          }}
        >
          {c}
        </div>
      ))}
    </div>
  );
}

function Byline({ portrait, small = false }: { portrait?: string; small?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      {portrait && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={portrait}
          width={56}
          height={56}
          alt=""
          style={{ borderRadius: 999, border: `2px solid ${ACCENT}`, objectFit: "cover" }}
        />
      )}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: small ? 26 : 28, fontWeight: 700, letterSpacing: -0.5 }}>{site.name}</div>
        <div style={{ fontSize: 19, color: MUTED, marginTop: 3 }}>{`${profile.roleChip} · ${profile.location}`}</div>
      </div>
    </div>
  );
}

/** The night sky every card is set in. */
function Sky({ a, children, moonAt = { left: 712, top: 46 } }: { a: Assets; children: React.ReactNode; moonAt?: { left: number; top: number } }) {
  const stars: [number, number, number][] = [
    [64, 300, 1.6], [196, 42, 1.4], [300, 120, 1], [470, 36, 1.8], [560, 210, 1.1], [640, 96, 1.3],
    [868, 30, 1.5], [980, 58, 1], [1150, 140, 1.6], [1170, 30, 1.1], [420, 330, 1], [760, 380, 1.2],
    [1040, 450, 1.1], [120, 470, 1.2], [600, 470, 1], [900, 250, 1],
  ];
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        fontFamily: "Geist",
        color: FG,
        backgroundColor: SKY_A,
        backgroundImage: `radial-gradient(80% 50% at 50% 100%, rgba(52, 88, 160, 0.42), transparent 70%), radial-gradient(42% 48% at 6% 0%, rgba(117, 231, 191, 0.14), transparent 70%), radial-gradient(30% 40% at ${moonAt.left + 40}px ${moonAt.top + 40}px, rgba(222, 233, 245, 0.16), transparent 70%), linear-gradient(180deg, ${SKY_A}, ${SKY_B})`,
      }}
    >
      {stars.map(([x, y, r], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: r * 2,
            height: r * 2,
            borderRadius: 999,
            background: "#e8eef8",
            opacity: 0.4 + (i % 4) * 0.12,
          }}
        />
      ))}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={a.moon} width={80} height={80} alt="" style={{ position: "absolute", left: moonAt.left, top: moonAt.top }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={a.skyline} width={1200} height={132} alt="" style={{ position: "absolute", left: 0, bottom: 0 }} />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1200,
          height: 7,
          backgroundImage: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_2})`,
        }}
      />
      {children}
    </div>
  );
}

function Portrait({ a }: { a: Assets }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 820,
        top: 92,
        width: 310,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          padding: 5,
          borderRadius: 42,
          backgroundImage: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_2})`,
          boxShadow: "0 30px 80px -20px rgba(117, 231, 191, 0.4)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.portrait} width={300} height={300} alt="" style={{ borderRadius: 38, objectFit: "cover" }} />
      </div>
      <div style={{ fontSize: 22, color: ACCENT, letterSpacing: 0.5 }}>{domain}</div>
    </div>
  );
}

/** Project art in a glass frame. */
function Art({ src, width, height, style }: { src: string; width: number; height: number; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        display: "flex",
        padding: 6,
        borderRadius: 22,
        background: "rgba(30,33,45,0.85)",
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 30px 70px -24px rgba(0,0,0,0.9)",
        ...style,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} width={width} height={height} alt="" style={{ borderRadius: 16, objectFit: "cover" }} />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Cards
 * ------------------------------------------------------------------ */
type Card =
  | { variant: "profile"; label: string; title: string; chips?: string[] }
  | { variant: "projects"; label: string; title: string; projects: { name: string; subtitle: string; image: string }[] }
  | { variant: "blog"; label: string; title: string; posts: { title: string; date: string }[] }
  | { variant: "article"; label: string; title: string; meta: string; cover: string };

/**
 * One template family for every card on the site, set in the site's night
 * sky. Each card says what its page is — the person on the home page, the
 * projects on the portfolio, the newest posts on the blog, a post's own art —
 * rather than the same portrait with a different headline.
 */
export async function renderOg(card: Card) {
  const a = await loadAssets();
  const fonts = [
    { name: "Geist", data: a.regular, weight: 400 as const, style: "normal" as const },
    { name: "Geist", data: a.bold, weight: 700 as const, style: "normal" as const },
  ];

  let body: React.ReactNode;

  if (card.variant === "profile") {
    body = (
      <>
        <div style={{ display: "flex", flexDirection: "column", padding: "62px 72px 0", width: 760, gap: 30 }}>
          <div style={{ display: "flex" }}>
            <Label text={card.label} />
          </div>
          <div
            style={{
              fontSize: titleSize(card.title, "half"),
              fontWeight: 700,
              letterSpacing: -2.4,
              lineHeight: 1.06,
              maxWidth: 680,
            }}
          >
            {card.title}
          </div>
          {card.chips && (
            <Chips items={card.chips} />
          )}
        </div>
        <div style={{ position: "absolute", left: 72, bottom: 140, display: "flex" }}>
          <Byline />
        </div>
        <Portrait a={a} />
      </>
    );
  } else if (card.variant === "projects") {
    const [p1, p2, p3] = card.projects;
    body = (
      <>
        <div style={{ display: "flex", flexDirection: "column", padding: "62px 72px 0", width: 600, gap: 26 }}>
          <div style={{ display: "flex" }}>
            <Label text={card.label} />
          </div>
          <div style={{ fontSize: titleSize(card.title, "half") - 4, fontWeight: 700, letterSpacing: -2.2, lineHeight: 1.06 }}>
            {card.title}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {card.projects.map((p) => (
              <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 22 }}>
                <div style={{ width: 8, height: 8, borderRadius: 999, background: ACCENT }} />
                <div style={{ color: FG, fontWeight: 700 }}>{p.name}</div>
                <div style={{ color: MUTED }}>{p.subtitle}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: "absolute", left: 72, bottom: 140, display: "flex" }}>
          <Byline />
        </div>
        {/* The three projects, fanned like prints on a desk. */}
        {p3 && <Art src={a.art[p3.image]} width={400} height={250} style={{ position: "absolute", left: 742, top: 286, transform: "rotate(7deg)" }} />}
        {p2 && <Art src={a.art[p2.image]} width={400} height={250} style={{ position: "absolute", left: 660, top: 196, transform: "rotate(-4deg)" }} />}
        {p1 && <Art src={a.art[p1.image]} width={420} height={262} style={{ position: "absolute", left: 704, top: 64, transform: "rotate(1.5deg)" }} />}
      </>
    );
  } else if (card.variant === "blog") {
    body = (
      <>
        <div style={{ display: "flex", flexDirection: "column", padding: "62px 72px 0", width: 560, gap: 28 }}>
          <div style={{ display: "flex" }}>
            <Label text={card.label} />
          </div>
          <div style={{ fontSize: 68, fontWeight: 700, letterSpacing: -2.6, lineHeight: 1.04 }}>{card.title}</div>
          <div style={{ fontSize: 24, color: MUTED, lineHeight: 1.4, maxWidth: 440 }}>
            Write-ups of the things I build — how they work and what broke.
          </div>
        </div>
        <div style={{ position: "absolute", left: 72, bottom: 140, display: "flex" }}>
          <Byline />
        </div>
        <div style={{ position: "absolute", left: 636, top: 70, display: "flex", flexDirection: "column", gap: 14, width: 500 }}>
          {card.posts.slice(0, 3).map((p, i) => (
            <div
              key={p.title}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: "18px 22px",
                borderRadius: 18,
                background: "rgba(30,33,45,0.82)",
                border: `1px solid ${i === 0 ? "rgba(117,231,191,0.4)" : "rgba(255,255,255,0.12)"}`,
              }}
            >
              <div style={{ fontSize: 16, letterSpacing: 2, color: i === 0 ? ACCENT : MUTED }}>{p.date.toUpperCase()}</div>
              <div style={{ fontSize: 25, fontWeight: 700, lineHeight: 1.2, letterSpacing: -0.4 }}>{p.title}</div>
            </div>
          ))}
        </div>
      </>
    );
  } else {
    body = (
      <>
        <div style={{ display: "flex", flexDirection: "column", padding: "62px 0 0 72px", width: 660, gap: 24 }}>
          <div style={{ display: "flex" }}>
            <Label text={card.label} />
          </div>
          <div style={{ fontSize: titleSize(card.title, "half"), fontWeight: 700, letterSpacing: -2.2, lineHeight: 1.06 }}>
            {card.title}
          </div>
          <div style={{ fontSize: 24, color: MUTED }}>{card.meta}</div>
        </div>
        <div style={{ position: "absolute", left: 72, bottom: 140, display: "flex" }}>
          <Byline portrait={a.portrait} small />
        </div>
        <Art src={a.art[card.cover] ?? a.art["/work/web-game.svg"]} width={400} height={250} style={{ position: "absolute", left: 724, top: 172, transform: "rotate(2deg)" }} />
        <div style={{ position: "absolute", left: 700, top: 52, width: 428, display: "flex", justifyContent: "flex-end", fontSize: 22, color: ACCENT }}>
          {domain}
        </div>
      </>
    );
  }

  const moonAt = card.variant === "profile" ? { left: 700, top: 44 } : card.variant === "article" ? { left: 600, top: 44 } : { left: 560, top: 40 };
  return new ImageResponse(<Sky a={a} moonAt={moonAt}>{body}</Sky>, { ...OG_SIZE, fonts });
}
