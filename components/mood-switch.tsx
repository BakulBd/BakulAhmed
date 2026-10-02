"use client";

import { useEffect, useRef, useState } from "react";
import { useMood } from "./mood-provider";
import { radioKeys } from "./radio-keys";
import { moods } from "@/lib/content";

/** Small pictograms for the four moods — sun height tells the story. */
export function MoodIcon({ id, size = 15 }: { id: string; size?: number }) {
  const base = { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true } as const;
  const stroke = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (id === "day") {
    return (
      <svg {...base}>
        <g {...stroke}>
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.6v2M12 19.4v2M21.4 12h-2M4.6 12h-2M18.4 5.6 17 7M7 17l-1.4 1.4M18.4 18.4 17 17M7 7 5.6 5.6" />
        </g>
      </svg>
    );
  }
  if (id === "night") {
    return (
      <svg {...base}>
        <path {...stroke} d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.4 8.4 0 1 0 20 14.2Z" />
      </svg>
    );
  }
  // dawn and dusk: a half sun on the horizon, arrow up or down
  const up = id === "dawn";
  return (
    <svg {...base}>
      <g {...stroke}>
        <path d="M3.5 18.5h17" />
        <path d="M7.8 18.5a4.2 4.2 0 0 1 8.4 0" />
        <path d={up ? "M12 3.5v4m0-4 2 2m-2-2-2 2" : "M12 7.5v-4m0 4 2-2m-2 2-2-2"} />
        <path d="M4.6 13.4 5.7 14M19.4 13.4 18.3 14" />
      </g>
    </svg>
  );
}

/**
 * The four-way light switch. It is the background control: picking a mood
 * re-lights the scene and flips the surface theme with it.
 */
export default function MoodSwitch() {
  const { mood, auto, setMood } = useMood();
  const listRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list || !mood) return;
    const measure = () => {
      const active = list.querySelector<HTMLElement>(`[data-mood-id="${mood}"]`);
      if (!active) return;
      const a = list.getBoundingClientRect();
      const b = active.getBoundingClientRect();
      setPill({ left: b.left - a.left, width: b.width });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [mood]);

  return (
    <div
      ref={listRef}
      role="radiogroup"
      aria-label="Background lighting"
      className="dock relative flex items-center gap-0.5 p-1"
    >
      {pill && (
        <span
          aria-hidden="true"
          className="dock__pill absolute inset-y-1 left-0"
          style={{ transform: `translateX(${pill.left}px)`, width: pill.width }}
        />
      )}
      {moods.map((m, i) => {
        const active = mood === m.id;
        const current = Math.max(0, moods.findIndex((x) => x.id === mood));
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={active}
            // One Tab stop for the group; arrows move between the moods.
            tabIndex={i === current ? 0 : -1}
            onKeyDown={(e) => radioKeys(e, moods.length, current, (n) => setMood(moods[n].id))}
            data-mood-id={m.id}
            title={active && auto ? `${m.label} — following your clock` : m.label}
            onClick={() => setMood(m.id)}
            className={`relative z-10 inline-flex size-8 items-center justify-center rounded-full transition-colors duration-300 max-[300px]:size-7 md:size-9 ${
              active ? "text-accent-contrast" : "text-muted hover:text-fg"
            }`}
          >
            <MoodIcon id={m.icon} />
            <span className="sr-only">
              {m.label}
              {active && auto ? " (following your clock)" : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
