"use client";

import { useEffect, useState } from "react";

/** Long enough to read the whole phrase and rest on it before it moves. */
const DWELL_MS = 4200;

/**
 * Cycles the roles with a single calm crossfade. An earlier version typed
 * character by character, which read as restless no matter how slow the
 * timing was — one settled swap per phrase is quieter than sixty.
 *
 * Under reduced motion it renders the roles as a plain list and never moves.
 */
export default function RoleRotator({ roles }: { roles: readonly string[] }) {
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setAnimate(true);
    if (roles.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % roles.length), DWELL_MS);
    return () => window.clearInterval(id);
  }, [roles.length]);

  if (!animate) {
    return <span className="text-accent">{roles.join(" · ")}</span>;
  }

  return (
    <span className="rotator text-accent">
      {/* Screen readers get the full list once, not one phrase at a time. */}
      <span className="sr-only">{roles.join(", ")}</span>
      <span key={index} aria-hidden="true" className="rotator__item">
        {roles[index]}
      </span>
    </span>
  );
}
