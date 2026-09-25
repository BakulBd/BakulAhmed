import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { profile, site } from "@/lib/content";

export const OG_SIZE = { width: 1200, height: 630 };

// The night mood — the site's default sky and its accent pair.
const SKY_A = "#030810";
const SKY_B = "#101926";
const ACCENT = "#75e7bf";
const ACCENT_2 = "#87bafe";
const FG = "#f7f8fb";
const MUTED = "#a7acbd";

const domain = new URL(site.url).host;

/** Read once per build; every card shares the fonts and the portrait. */
let assets: Promise<{ regular: Buffer; bold: Buffer; portrait: string }> | undefined;
function loadAssets() {
  assets ??= (async () => {
    const root = process.cwd();
    const [regular, bold, photo] = await Promise.all([
      readFile(join(root, "assets/fonts/Geist-Regular.ttf")),
      readFile(join(root, "assets/fonts/Geist-Bold.ttf")),
      readFile(join(root, "public", profile.image.src)),
    ]);
    return { regular, bold, portrait: `data:image/jpeg;base64,${photo.toString("base64")}` };
  })();
  return assets;
}

const titleSize = (title: string, wide: boolean) =>
  title.length <= 28 ? (wide ? 84 : 76) : title.length <= 52 ? (wide ? 68 : 62) : wide ? 58 : 52;

/**
 * One template for every card on the site.
 *
 * `profile` (the default) carries the portrait large on the right — these are
 * the cards for the site itself, where the person is the subject. `article`
 * gives a post's title the full width and puts the portrait in a byline, the
 * way a publication's card would.
 */
export async function renderOg({
  label,
  title,
  meta,
  variant = "profile",
}: {
  label: string;
  title: string;
  /** A line under the title — date and reading time on a post. */
  meta?: string;
  variant?: "profile" | "article";
}) {
  const { regular, bold, portrait } = await loadAssets();
  const article = variant === "article";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          fontFamily: "Geist",
          color: FG,
          backgroundColor: SKY_A,
          backgroundImage: `radial-gradient(70% 55% at 50% 118%, rgba(56, 96, 170, 0.55), transparent 70%), radial-gradient(40% 50% at 8% 0%, rgba(117, 231, 191, 0.16), transparent 70%), linear-gradient(180deg, ${SKY_A}, ${SKY_B})`,
        }}
      >
        {/* A few stars — the site's night sky, not decoration for its own sake. */}
        {[
          [84, 520, 2], [260, 70, 2], [460, 560, 1.5], [610, 44, 2.5], [742, 590, 1.5],
          [1010, 40, 2], [1150, 300, 1.5], [560, 300, 1.5], [1120, 580, 2],
        ].map(([x, y, r], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: r * 2,
              height: r * 2,
              borderRadius: 999,
              background: "#dfe9f5",
              opacity: 0.55,
            }}
          />
        ))}

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 8,
            backgroundImage: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_2})`,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "68px 72px 60px",
            width: article ? 1200 : 780,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 20px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(30,33,45,0.7)",
                fontSize: 22,
                letterSpacing: 2.5,
                color: MUTED,
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: 999, background: ACCENT }} />
              {label.toUpperCase()}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: titleSize(title, article),
                fontWeight: 700,
                letterSpacing: -2.5,
                lineHeight: 1.06,
                maxWidth: article ? 1040 : 660,
              }}
            >
              {title}
            </div>
            {meta && <div style={{ marginTop: 22, fontSize: 28, color: MUTED }}>{meta}</div>}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              {article && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={portrait}
                  width={64}
                  height={64}
                  alt=""
                  style={{ borderRadius: 999, border: `2px solid ${ACCENT}`, objectFit: "cover" }}
                />
              )}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>{site.name}</div>
                <div style={{ fontSize: 21, color: MUTED, marginTop: 4 }}>
                  {`${profile.roleChip} · ${profile.location}`}
                </div>
              </div>
            </div>
            {article && <div style={{ fontSize: 24, color: ACCENT }}>{domain}</div>}
          </div>
        </div>

        {!article && (
          <div
            style={{
              position: "absolute",
              right: 72,
              top: 110,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 22,
            }}
          >
            <div
              style={{
                display: "flex",
                padding: 5,
                borderRadius: 44,
                backgroundImage: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_2})`,
                boxShadow: "0 30px 80px -20px rgba(117, 231, 191, 0.35)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={portrait}
                width={330}
                height={330}
                alt=""
                style={{ borderRadius: 40, objectFit: "cover" }}
              />
            </div>
            <div style={{ fontSize: 24, color: ACCENT, letterSpacing: 0.5 }}>{domain}</div>
          </div>
        )}
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Geist", data: regular, weight: 400, style: "normal" },
        { name: "Geist", data: bold, weight: 700, style: "normal" },
      ],
    },
  );
}
