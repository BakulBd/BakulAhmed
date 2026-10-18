import MoonCanvas from "./moon-canvas";

/** One full set of scene layers, painted for a single mood. */
function Layers() {
  return (
    <>
      <div className="scene__sky" />
      {/* Grain sits directly over the sky, which is the only thing that bands.
          Above the clouds its blend mode would force everything beneath it to
          re-composite each frame — measured at 25 FPS on a desktop. */}
      <div className="scene__grain" />
      {/* The Milky Way, behind the moon: a dark night's band of starlight. */}
      <div className="scene__galaxy" />
      <div className="scene__celestial">
        {/* Tonight's moon, rendered into this canvas by the head script
            (window.__sky.drawMoon) before hydration. React leaves its pixels
            alone; the size here must match what the renderer expects. */}
        <MoonCanvas />
      </div>
      <div className="scene__glow" />
      <div className="scene__cirrus" />
      <div className="scene__clouds" />
      <div className="scene__clouds scene__clouds--low" />
      {/* The sun burning through whatever cloud is crossing it. */}
      <div className="scene__flare" />
      {/* Hills behind the city carry the season: green, gold, rust, snow. */}
      <div className="scene__hills" />
      {/* After dark, the city lights the air above it: a low, warm band in
          front of the hills and behind the buildings (app/polish.css). */}
      <div className="scene__citylight" />
      {/* The city in three planes, with mist lying between the far one and
          the rest (shapes: scripts/skyline.mjs). */}
      <div className="scene__ridge scene__ridge--far" />
      <div className="scene__haze" />
      <div className="scene__ridge scene__ridge--mid" />
      {/* Its windows come on in two waves (its own ::before and ::after);
          the masts' aviation lights blink on the sky's canvas. */}
      <div className="scene__ridge scene__ridge--near" />
      {/* The rooftops catch the hour's light — and in winter, snow. */}
      <div className="scene__rim" />
    </>
  );
}

/**
 * The background: one scene, re-lit by [data-mood].
 *
 * The layers read animated custom properties, so a mood change grades them in
 * place. Cross-fading two complete sets was tried and measured worse — it
 * rasterises twice the gradient area — so the cost is kept down instead by
 * making the expensive layers small: the sun is a compact element that moves,
 * not a full-viewport gradient whose centre is animated.
 */
export default function Scene() {
  // No scroll parallax. It used to slide the city — buildings, lit windows,
  // fireflies — down and out of the frame as you read, and on a long page
  // carried the sky past its own edge. The landscape now stays where it is,
  // like a horizon does, and scrolling costs the scene nothing. (The layers
  // still read --p1/--p2/--p3, which default to 0, should it ever return.)
  return (
    <div aria-hidden="true" className="scene">
      <Layers />
    </div>
  );
}
