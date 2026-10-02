"use client";

import { useEffect, useState } from "react";

/** Long enough to read the whole phrase and rest on it before it moves. */
const DWELL_MS = 4200;

/**
 * Cycles the roles with a single calm crossfade. An earlier version typed
 * character by character, which read as restless no matter how slow the
 * timing was — one settled swap per phrase is quieter than sixty.
 *
 * The server renders exactly the first frame the client will show — one
 * role. It used to render all five joined, which wrapped to two lines on a
 * desktop and four on a phone, then collapsed to one on hydration and shoved
 * the rest of the hero up: the page's only layout shift.
 *
 * Under reduced motion it shows the roles as a plain list and never moves.
 */
export default function RoleRotator({ roles }: { roles: readonly string[] }) {
  // A running count, not an index: the first frame is static (it is what the
  // server rendered), and every swap after it — including back to the first
  // role — fades in.
  const [tick, setTick] = useState(0);
  const [still, setStill] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStill(true);
      return;
    }
    if (roles.length < 2) return;
    const id = window.setInterval(() => setTick((t) => t + 1), DWELL_MS);
    return () => window.clearInterval(id);
  }, [roles.length]);

  if (still) {
    return <span className="text-accent">{roles.join(" · ")}</span>;
  }

  return (
    <span className="rotator text-accent">
      {/* Screen readers get the full list once, not one phrase at a time. */}
      <span className="sr-only">{roles.join(", ")}</span>
      <span key={tick} aria-hidden="true" className={tick === 0 ? "inline-block" : "rotator__item"}>
        {roles[tick % roles.length]}
      </span>
    </span>
  );
}
