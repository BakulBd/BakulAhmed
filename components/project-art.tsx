import Image from "next/image";

/**
 * Project artwork, drawn inline from the mood's own tokens.
 *
 * The three previews used to be static SVG files in stock framework cyan and
 * indigo — the same two colours in every mood, and the two the palette gate
 * exists to keep out. Inline, they take --accent and --accent-2 like the rest
 * of the page, so a project card at dusk is lit like dusk.
 *
 * Each scene animates the thing the project actually does — packets between
 * clients and an authoritative server, an explanation being written before a
 * merge, a detector scanning a frame — but only while its card is pointed at
 * or focused (or when `live`, for a post's cover). Idle cards cost nothing.
 *
 * The files in /public/work stay, recoloured to the night palette: Open Graph
 * cards and RSS readers need a real image.
 *
 * `uid` keeps gradient ids unique when the same art appears twice on a page.
 */

type ArtProps = { uid: string };

const ART: Record<string, (p: ArtProps) => React.JSX.Element> = {
  "/work/web-game.svg": WebGame,
  "/work/epistemic-guard.svg": EpistemicGuard,
  "/work/green-guardian.svg": GreenGuardian,
  "/work/hostinger-kvm4-malaysia.svg": KvmBenchmark,
};

export function hasArt(src: string) {
  return src in ART;
}

export default function ProjectArt({
  src,
  alt,
  uid,
  live = false,
  sizes,
  preload = false,
  fit = "cover",
  className = "",
}: {
  src: string;
  alt: string;
  uid: string;
  live?: boolean;
  sizes: string;
  preload?: boolean;
  /** `contain` shows the whole scene in a frame of any shape; the ground runs
      on past the edges, so the letterbox is more of the same field. */
  fit?: "cover" | "contain";
  className?: string;
}) {
  const Art = ART[src];
  if (!Art) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        preload={preload}
        fetchPriority={preload ? "high" : undefined}
        unoptimized={src.endsWith(".svg")}
        className={`object-cover ${className}`}
      />
    );
  }
  return (
    <svg
      viewBox="0 0 1600 1000"
      preserveAspectRatio={fit === "cover" ? "xMidYMid slice" : "xMidYMid meet"}
      role="img"
      aria-label={alt}
      className={`art absolute inset-0 size-full ${live ? "art--live" : ""} ${className}`}
    >
      <Art uid={uid} />
    </svg>
  );
}

/** Shared ground: deep field, a faint grid, and the mood's light pooling in it. */
function Ground({ uid, glowAt = "50% 45%" }: { uid: string; glowAt?: string }) {
  // In user units, so the pool stays put however far the ground extends.
  const [cx, cy] = glowAt.split(" ").map((v, i) => (parseFloat(v) / 100) * (i ? 1000 : 1600));
  return (
    <>
      <defs>
        <pattern id={`grid-${uid}`} width="64" height="64" patternUnits="userSpaceOnUse">
          <path d="M64 0H0V64" className="art__grid" />
        </pattern>
        <radialGradient id={`pool-${uid}`} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r="960">
          <stop offset="0" className="art__stop-a" stopOpacity="0.2" />
          <stop offset="0.45" className="art__stop-b" stopOpacity="0.07" />
          <stop offset="1" className="art__stop-b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`rule-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" className="art__stop-a" />
          <stop offset="1" className="art__stop-b" />
        </linearGradient>
      </defs>
      {/* Oversized: with `contain`, the field continues into the letterbox. */}
      <rect x="-1600" y="-1500" width="4800" height="4000" className="art__bg" />
      <rect x="-1600" y="-1500" width="4800" height="4000" fill={`url(#grid-${uid})`} />
      <rect x="-1600" y="-1500" width="4800" height="4000" fill={`url(#pool-${uid})`} />
    </>
  );
}

function Title({ uid, text, right, footer, footerRight }: { uid: string; text: string; right: string; footer?: string; footerRight?: string }) {
  return (
    <g className="art__mono">
      <text x="80" y="112" className="art__label" fontSize="30" letterSpacing="5">
        {text}
      </text>
      <rect x="80" y="138" width="250" height="5" rx="2.5" fill={`url(#rule-${uid})`} />
      <text x="1520" y="112" textAnchor="end" className="art__faint" fontSize="24" letterSpacing="4">
        {right}
      </text>
      {footer && (
        <text x="80" y="930" className="art__faint" fontSize="24" letterSpacing="4">
          {footer}
        </text>
      )}
      {footerRight && (
        <text x="1520" y="930" textAnchor="end" className="art__faint" fontSize="24" letterSpacing="4">
          {footerRight}
        </text>
      )}
    </g>
  );
}

/* ------------------------------------------------------------------ *
 * Web Game Platform — clients synchronising against one server
 * ------------------------------------------------------------------ */
function WebGame({ uid }: ArtProps) {
  const clients = [
    { x: 300, y: 250 },
    { x: 1140, y: 250 },
    { x: 300, y: 650 },
    { x: 1140, y: 650 },
  ];
  return (
    <>
      <Ground uid={uid} />
      {/* Links: state flows down from the server, inputs flow up to it. */}
      <g>
        {clients.map((c, i) => {
          const d = `M800 500L${c.x + 80} ${c.y + 50}`;
          return (
            <g key={i}>
              <path d={d} className="art__link" />
              <path d={d} pathLength={100} className="art__packet anim" style={{ animationDelay: `${i * -0.55}s` }} />
              <path
                d={`M${c.x + 80} ${c.y + 50}L800 500`}
                pathLength={100}
                className="art__packet art__packet--up anim"
                style={{ animationDelay: `${i * -0.4 - 1.1}s` }}
              />
            </g>
          );
        })}
      </g>

      {/* The authoritative server: an isometric block inside a turning ring. */}
      <g className="art__spin anim" style={{ transformOrigin: "800px 500px" }}>
        <circle cx="800" cy="500" r="150" className="art__ring" />
        <circle cx="800" cy="350" r="7" className="art__a" />
        <circle cx="950" cy="500" r="5" className="art__b" />
      </g>
      <circle cx="800" cy="500" r="118" className="art__ring art__ring--soft" />
      <g className="art__float anim">
        <path d="M800 400 900 455v115l-100 57-100-57V455z" className="art__solid" />
        <path d="M800 400 900 455 800 512 700 455z" className="art__face-top" />
        <path d="M800 512v115M800 512 900 455M800 512 700 455" className="art__edge" />
        <path d="M748 540l-30-17M748 566l-30-17M748 592l-30-17" className="art__edge-a" />
      </g>

      {/* Clients: a viewport each, with a little scene and a live dot. */}
      {clients.map((c, i) => (
        <g key={i}>
          <rect x={c.x} y={c.y} width="160" height="100" rx="14" className="art__panel" />
          <path d={`M${c.x + 18} ${c.y + 76}l26-22 18 12 24-26 22 18 34-14`} className="art__edge" />
          <circle cx={c.x + 138} cy={c.y + 22} r="7" className="art__a art__pulse anim" style={{ animationDelay: `${i * 0.3}s` }} />
          <text x={c.x} y={c.y + (c.y < 500 ? -16 : 134)} className="art__mono art__faint" fontSize="20" letterSpacing="3">
            {`P${i + 1} · ${[32, 48, 27, 61][i]}MS`}
          </text>
        </g>
      ))}

      <Title uid={uid} text="WEB GAME PLATFORM" right="60 TICK" footer="COLYSEUS · WEBSOCKETS · AUTHORITATIVE STATE" footerRight="THREE.JS" />
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Epistemic Guard — explain the AI's code before you merge it
 * ------------------------------------------------------------------ */
function EpistemicGuard({ uid }: ArtProps) {
  const code = [
    { x: 152, w: 300, a: 0.24 },
    { x: 152, w: 420, a: 0.15 },
    { x: 192, w: 360, a: 0.15 },
    { x: 192, w: 248, a: 0, hit: true },
    { x: 152, w: 330, a: 0.15 },
    { x: 192, w: 286, a: 0.15 },
    { x: 232, w: 210, a: 0.15 },
    { x: 152, w: 200, a: 0.15 },
  ];
  return (
    <>
      <Ground uid={uid} glowAt="30% 50%" />

      {/* Editor */}
      <rect x="80" y="200" width="740" height="660" rx="18" className="art__panel" />
      <path d="M80 262h740" className="art__hair" />
      <g className="art__ink" fillOpacity="0.22">
        <circle cx="118" cy="231" r="8" />
        <circle cx="146" cy="231" r="8" />
        <circle cx="174" cy="231" r="8" />
      </g>
      <text x="560" y="240" className="art__mono art__faint" fontSize="20" letterSpacing="2">
        reconcile.ts
      </text>
      <rect x="132" y="430" width="660" height="40" rx="8" className="art__hilite" />
      <rect x="132" y="430" width="6" height="40" rx="3" className="art__a" />
      {code.map((l, i) => (
        <g key={i}>
          <text x="104" y={322 + i * 52} className="art__mono art__faint" fontSize="20">
            {i + 1}
          </text>
          <rect
            x={l.x}
            y={306 + i * 52}
            width={l.w}
            height="20"
            rx="5"
            className={l.hit ? "art__a" : "art__ink"}
            fillOpacity={l.hit ? 0.9 : l.a}
          />
        </g>
      ))}
      <rect x="452" y="460" width="4" height="26" className="art__a art__blink anim" />

      {/* The AI's explanation, being written */}
      <rect x="880" y="200" width="640" height="310" rx="18" className="art__panel art__panel--b" />
      <text x="916" y="254" className="art__mono art__b-text" fontSize="22" letterSpacing="3">
        AI EXPLANATION
      </text>
      {[560, 520, 576, 430].map((w, i) => (
        <rect
          key={i}
          x="916"
          y={284 + i * 34}
          width={w}
          height="15"
          rx="5"
          className="art__ink art__type anim"
          fillOpacity="0.2"
          style={{ animationDelay: `${i * 0.35}s` }}
        />
      ))}
      <rect x="916" y="436" width="250" height="46" rx="10" className="art__chip-b" />
      <text x="941" y="466" className="art__mono art__b-text" fontSize="20" letterSpacing="2">
        EXPLAIN TO MERGE
      </text>

      {/* Comprehension */}
      <rect x="880" y="550" width="640" height="310" rx="18" className="art__panel" />
      <text x="916" y="604" className="art__mono art__faint" fontSize="22" letterSpacing="3">
        COMPREHENSION
      </text>
      {[0.73, 0.53, 0.87, 0.63].map((v, i) => (
        <g key={i}>
          <rect x="916" y={636 + i * 50} width="560" height="14" rx="7" className="art__ink" fillOpacity="0.1" />
          <rect
            x="916"
            y={636 + i * 50}
            width={560 * v}
            height="14"
            rx="7"
            fill={`url(#rule-${uid})`}
            className="art__grow anim"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        </g>
      ))}

      <Title uid={uid} text="EPISTEMIC GUARD" right="VS CODE · LLM" />
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Green Guardian — proctoring, integrity signals, analytics
 * ------------------------------------------------------------------ */
function GreenGuardian({ uid }: ArtProps) {
  const bars = [46, 80, 64, 112, 58, 88, 70, 96];
  return (
    <>
      <Ground uid={uid} glowAt="25% 40%" />

      {/* The proctoring frame */}
      <rect x="80" y="200" width="620" height="420" rx="18" className="art__panel" />
      <g className="art__ink" fillOpacity="0.07">
        <circle cx="390" cy="372" r="74" />
        <path d="M262 600a128 128 0 0 1 256 0z" />
      </g>
      <g className="art__edge">
        <circle cx="390" cy="372" r="74" fill="none" />
        <path d="M262 600a128 128 0 0 1 256 0" fill="none" />
      </g>
      <g className="art__breathe anim" style={{ transformOrigin: "390px 374px" }}>
        <rect x="288" y="272" width="204" height="204" rx="6" className="art__box" />
        <rect x="288" y="236" width="196" height="34" rx="6" className="art__a" />
        <text x="302" y="261" className="art__mono art__on-a" fontSize="20" letterSpacing="1">
          FACE · 0.98
        </text>
      </g>
      <path
        d="M112 238h44M112 238v44M668 238h-44M668 238v44M112 582h44M112 582v-44M668 582h-44M668 582v-44"
        className="art__corner"
      />
      <rect x="96" y="216" width="588" height="3" className="art__scan anim" />
      <circle cx="122" cy="590" r="7" className="art__rec art__pulse anim" />
      <text x="138" y="597" className="art__mono art__faint" fontSize="18" letterSpacing="2">
        REC
      </text>

      {/* Integrity signals */}
      <rect x="740" y="200" width="780" height="200" rx="18" className="art__panel" />
      <text x="776" y="254" className="art__mono art__faint" fontSize="22" letterSpacing="3">
        INTEGRITY SIGNALS
      </text>
      {[
        ["Gaze", "OK", "a"],
        ["Tab focus", "OK", "a"],
        ["Plagiarism", "4.2%", "b"],
      ].map(([k, v, tone], i) => (
        <g key={k} className="art__mono" fontSize="22">
          <text x="776" y={300 + i * 36} className="art__ink" fillOpacity="0.6">
            {k}
          </text>
          <text x="1484" y={300 + i * 36} textAnchor="end" className={tone === "a" ? "art__a" : "art__b-text"}>
            {v}
          </text>
        </g>
      ))}

      {/* OCR and marking */}
      <rect x="740" y="424" width="780" height="196" rx="18" className="art__panel" />
      <text x="776" y="476" className="art__mono art__faint" fontSize="22" letterSpacing="3">
        OCR · AI MARKING
      </text>
      {[700, 640, 540].map((w, i) => (
        <rect
          key={i}
          x="776"
          y={506 + i * 32}
          width={w}
          height="14"
          rx="5"
          className="art__ink art__type anim"
          fillOpacity="0.16"
          style={{ animationDelay: `${i * 0.3}s` }}
        />
      ))}

      {/* Analytics */}
      <rect x="80" y="660" width="1440" height="200" rx="18" className="art__panel" />
      {bars.map((h, i) => (
        <rect
          key={i}
          x={120 + i * 84}
          y={830 - h}
          width="52"
          height={h}
          rx="6"
          className={`art__rise anim ${i === 3 ? "" : "art__ink"}`}
          fill={i === 3 ? `url(#rule-${uid})` : undefined}
          fillOpacity={i === 3 ? 1 : 0.15}
          style={{ animationDelay: `${i * 0.08}s`, transformOrigin: `0 830px` }}
        />
      ))}
      <text x="840" y="742" className="art__mono art__faint" fontSize="22" letterSpacing="3">
        ACADEMIC ANALYTICS
      </text>
      <text x="840" y="804" className="art__mono art__ink" fillOpacity="0.75" fontSize="48">
        1,240 submissions
      </text>

      <Title uid={uid} text="GREEN GUARDIAN" right="TENSORFLOW.JS · GEMINI" />
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Hostinger KVM 4 Malaysia Benchmark — hardware & network telemetry
 * ------------------------------------------------------------------ */
function KvmBenchmark({ uid }: ArtProps) {
  const ioBars = [
    { label: "4K (114k IOPS)", v: 0.32 },
    { label: "64K (5.67 GB/s)", v: 0.92 },
    { label: "512K (5.76 GB/s)", v: 0.98 },
    { label: "1M (5.65 GB/s)", v: 0.94 },
  ];
  return (
    <>
      <Ground uid={uid} glowAt="50% 48%" />

      {/* Central EPYC Compute Hub */}
      <g className="art__spin anim" style={{ transformOrigin: "800px 450px", animationDuration: "18s" }}>
        <circle cx="800" cy="450" r="140" className="art__ring" />
        <circle cx="800" cy="310" r="7" className="art__a" />
        <circle cx="940" cy="450" r="5" className="art__b" />
        <circle cx="660" cy="450" r="5" className="art__b" />
      </g>
      <circle cx="800" cy="450" r="115" className="art__ring art__ring--soft" />

      {/* Central Server Die: AMD EPYC */}
      <g className="art__float anim" style={{ transformOrigin: "800px 450px" }}>
        <rect x="710" y="360" width="180" height="180" rx="20" className="art__panel art__panel--b" />
        <rect x="730" y="380" width="140" height="140" rx="14" className="art__solid" />
        <path d="M745 420h110M745 450h110M745 480h110" className="art__edge" />
        <circle cx="800" cy="450" r="18" className="art__face-top" />
        <text x="800" y="442" textAnchor="middle" className="art__mono art__a" fontSize="16" letterSpacing="2" fontWeight="700">
          EPYC
        </text>
        <text x="800" y="468" textAnchor="middle" className="art__mono art__b-text" fontSize="13" letterSpacing="1">
          ZEN 4
        </text>
        {/* Core LED indicators */}
        <circle cx="738" cy="388" r="4" className="art__a art__pulse anim" />
        <circle cx="862" cy="388" r="4" className="art__a art__pulse anim" style={{ animationDelay: "0.2s" }} />
        <circle cx="738" cy="512" r="4" className="art__a art__pulse anim" style={{ animationDelay: "0.4s" }} />
        <circle cx="862" cy="512" r="4" className="art__a art__pulse anim" style={{ animationDelay: "0.6s" }} />
      </g>

      {/* Connection Links: Center to Left, Right, and Bottom */}
      <g>
        <path d="M710 450 L530 450" className="art__link" />
        <path d="M890 450 L1070 450" className="art__link" />
        <path d="M800 540 L800 660" className="art__link" />

        <path d="M710 450 L530 450" pathLength={100} className="art__packet anim" style={{ animationDuration: "2s" }} />
        <path d="M890 450 L1070 450" pathLength={100} className="art__packet anim" style={{ animationDuration: "1.6s", animationDelay: "-0.5s" }} />
        <path d="M800 540 L800 660" pathLength={100} className="art__packet anim" style={{ animationDuration: "2.2s", animationDelay: "-1s" }} />
      </g>

      {/* Left Pod: NVMe Storage IOPS & Throughput */}
      <g>
        <rect x="140" y="270" width="390" height="360" rx="18" className="art__panel" />
        <text x="175" y="322" className="art__mono art__faint" fontSize="22" letterSpacing="3">
          NVME STORAGE I/O
        </text>
        <text x="175" y="380" className="art__mono art__ink" fontSize="48" fontWeight="800">
          5.76 <tspan fontSize="26" className="art__a">GB/s</tspan>
        </text>
        <rect x="175" y="400" width="180" height="30" rx="6" className="art__hilite" />
        <text x="188" y="421" className="art__mono art__a" fontSize="15" fontWeight="700">
          114,100 4K IOPS
        </text>

        {/* Dynamic I/O Bars */}
        <g transform="translate(175, 455)">
          {ioBars.map((b, i) => (
            <g key={i} transform={`translate(0, ${i * 38})`}>
              <text x="0" y="14" className="art__mono art__faint" fontSize="14">
                {b.label}
              </text>
              <rect x="0" y="22" width="320" height="8" rx="4" className="art__ink" fillOpacity="0.1" />
              <rect
                x="0"
                y="22"
                width={320 * b.v}
                height="8"
                rx="4"
                fill={`url(#rule-${uid})`}
                className="art__grow anim"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            </g>
          ))}
        </g>
      </g>

      {/* Right Pod: Singapore Direct Peering */}
      <g>
        <rect x="1070" y="270" width="390" height="360" rx="18" className="art__panel art__panel--b" />
        <text x="1105" y="322" className="art__mono art__faint" fontSize="22" letterSpacing="3">
          REGIONAL ROUTE
        </text>
        <text x="1105" y="380" className="art__mono art__a" fontSize="48" fontWeight="800">
          6.08 <tspan fontSize="26" className="art__b-text">ms</tspan>
        </text>
        <rect x="1105" y="400" width="220" height="30" rx="6" className="art__hilite" />
        <text x="1118" y="421" className="art__mono art__b-text" fontSize="15" fontWeight="700">
          SINGAPORE LEASEWEB 10G
        </text>

        {/* Telemetry info */}
        <g transform="translate(1105, 465)" className="art__mono" fontSize="16">
          <text y="20" className="art__faint">TRANSIT: <tspan className="art__ink">AS47583 HOSTINGER</tspan></text>
          <text y="50" className="art__faint">IPv4 SPEED: <tspan className="art__a">1.01 Gbps</tspan></text>
          <text y="80" className="art__faint">IPv6 SPEED: <tspan className="art__b-text">996 Mbps</tspan></text>
          <text y="110" className="art__faint">JOHOR STRAIT: <tspan className="art__a">METRO-LAN HOP</tspan></text>
        </g>
      </g>

      {/* Bottom Center Bar: CPU Steal & Stability */}
      <g>
        <rect x="580" y="660" width="440" height="150" rx="16" className="art__panel" />
        <text x="610" y="700" className="art__mono art__faint" fontSize="18" letterSpacing="3">
          CPU STEAL (MPSTAT 60s)
        </text>
        <text x="610" y="748" className="art__mono art__a" fontSize="36" fontWeight="800">
          2.05% <tspan fontSize="20" className="art__faint">STEAL</tspan>
        </text>
        <text x="760" y="748" className="art__mono art__b-text" fontSize="36" fontWeight="800">
          0.00% <tspan fontSize="20" className="art__faint">I/O WAIT</tspan>
        </text>
        <text x="610" y="785" className="art__mono art__faint" fontSize="14">
          4 vCPU ZEN 4 CORES · 93.10% DEDICATED CAPACITY
        </text>
      </g>

      <Title
        uid={uid}
        text="HOSTINGER KVM 4 VPS"
        right="MALAYSIA // AS47583"
        footer="AMD EPYC 9354P · 16 GB DDR5 · 200 GB NVME"
        footerRight="6.08MS TO SINGAPORE"
      />
    </>
  );
}
