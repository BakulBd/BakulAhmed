/**
 * Placeholder artwork for the portrait swiper, used until real photographs are
 * listed in `profile.photos`. Four scenes nodding at the work: identity,
 * the editor, a model, and the 3D engine.
 */
export const SCENE_COUNT = 4;

function Monogram() {
  return (
    <svg viewBox="0 0 200 200" className="size-full" role="img" aria-label="Monogram">
      <circle cx="100" cy="100" r="72" fill="none" stroke="var(--accent)" strokeOpacity=".3" />
      <circle cx="100" cy="100" r="54" fill="none" stroke="var(--accent-2)" strokeOpacity=".2" />
      <text
        x="100" y="126" textAnchor="middle" fontSize="66" fontWeight="600"
        letterSpacing="-3" fill="var(--accent)" fontFamily="var(--font-geist-sans), sans-serif"
      >
        BA
      </text>
      <g className="portrait-orbit" style={{ transformOrigin: "100px 100px" }}>
        <circle cx="100" cy="28" r="4" fill="var(--accent)" />
        <circle cx="172" cy="100" r="2.5" fill="var(--accent-2)" />
      </g>
    </svg>
  );
}

function Editor() {
  return (
    <svg viewBox="0 0 200 200" className="size-full" role="img" aria-label="Code editor">
      <rect x="26" y="40" width="148" height="120" rx="10" fill="none" stroke="var(--accent)" strokeOpacity=".35" />
      <path d="M26 62h148" stroke="var(--accent)" strokeOpacity=".2" />
      <g fill="var(--accent)" fillOpacity=".7">
        <circle cx="40" cy="51" r="3.2" /><circle cx="52" cy="51" r="3.2" /><circle cx="64" cy="51" r="3.2" />
      </g>
      <g stroke="var(--accent-2)" strokeWidth="5" strokeLinecap="round" strokeOpacity=".65">
        <path className="portrait-type" style={{ animationDelay: "0ms" }} d="M44 84h50" />
        <path className="portrait-type" style={{ animationDelay: "260ms" }} d="M44 104h78" />
        <path className="portrait-type" style={{ animationDelay: "520ms" }} d="M56 124h44" />
        <path className="portrait-type" style={{ animationDelay: "780ms" }} d="M44 144h62" />
      </g>
    </svg>
  );
}

function Neural() {
  const layers = [
    [60, 100, 140],
    [46, 82, 118, 154],
    [70, 110],
  ];
  return (
    <svg viewBox="0 0 200 200" className="size-full" role="img" aria-label="Neural network">
      <g stroke="var(--accent)" strokeOpacity=".22">
        {layers[0].map((y1) => layers[1].map((y2) => <path key={`${y1}-${y2}`} d={`M62 ${y1} L100 ${y2}`} />))}
        {layers[1].map((y1) => layers[2].map((y2) => <path key={`b${y1}-${y2}`} d={`M100 ${y1} L138 ${y2}`} />))}
      </g>
      {layers.map((col, ci) =>
        col.map((y, i) => (
          <circle
            key={`${ci}-${y}`} cx={62 + ci * 38} cy={y} r="6"
            fill={ci === 1 ? "var(--accent-2)" : "var(--accent)"}
            className="portrait-pulse" style={{ animationDelay: `${(ci * 3 + i) * 140}ms` }}
          />
        )),
      )}
    </svg>
  );
}

function Cube() {
  return (
    <svg viewBox="0 0 200 200" className="size-full" role="img" aria-label="Rotating wireframe cube">
      <g className="portrait-spin" style={{ transformOrigin: "100px 100px" }} fill="none" strokeWidth="1.6">
        <path d="M100 44 164 80v72l-64 36-64-36V80z" stroke="var(--accent)" strokeOpacity=".55" />
        <path d="M100 44v72m0 0 64-36m-64 36-64-36m64 36v72" stroke="var(--accent-2)" strokeOpacity=".45" />
      </g>
      <circle cx="100" cy="116" r="5" fill="var(--accent)" className="portrait-pulse" />
    </svg>
  );
}

const scenes = [Monogram, Editor, Neural, Cube];

export default function GeneratedScene({ index }: { index: number }) {
  const Scene = scenes[index % scenes.length];
  return <Scene />;
}
