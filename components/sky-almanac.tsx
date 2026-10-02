"use client";

import { useMood } from "./mood-provider";
import { radioKeys } from "./radio-keys";
import { moods } from "@/lib/content";
import { seasons, type Season } from "@/lib/mood";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function SeasonIcon({ id }: { id: Season | "auto" }) {
  const base = { width: 14, height: 14, viewBox: "0 0 24 24", "aria-hidden": true } as const;
  switch (id) {
    case "spring":
      return (
        <svg {...base}>
          <g {...stroke}>
            {[0, 72, 144, 216, 288].map((a) => (
              <circle key={a} cx="12" cy="6.6" r="3.1" transform={`rotate(${a} 12 12)`} />
            ))}
            <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
          </g>
        </svg>
      );
    case "summer":
      return (
        <svg {...base}>
          <g {...stroke}>
            <circle cx="12" cy="12" r="4.4" fill="currentColor" fillOpacity=".25" />
            <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
          </g>
        </svg>
      );
    case "autumn":
      return (
        <svg {...base}>
          <g {...stroke}>
            <path d="M5 19c0-8.5 5.6-14 14.2-14.2C19 13.4 13.5 19 5 19Z" />
            <path d="M5 19 13.5 10.5" />
          </g>
        </svg>
      );
    case "winter":
      return (
        <svg {...base}>
          <g {...stroke}>
            <path d="M12 2.8v18.4M4 7.4l16 9.2M4 16.6l16-9.2" />
            <path d="m9.6 4.6 2.4 2 2.4-2M9.6 19.4l2.4-2 2.4 2M4.9 10.6l2.9-.9-.6-3M19.1 13.4l-2.9.9.6 3M4.9 13.4l2.9.9-.6 3M19.1 10.6l-2.9-.9.6-3" />
          </g>
        </svg>
      );
    default:
      // "Follow the calendar"
      return (
        <svg {...base}>
          <g {...stroke}>
            <rect x="3.5" y="5" width="17" height="15.5" rx="2.6" />
            <path d="M8 3v4M16 3v4M3.5 10h17" />
            <circle cx="12" cy="15" r="1.4" fill="currentColor" stroke="none" />
          </g>
        </svg>
      );
  }
}

/**
 * Tonight's moon, drawn exactly: the limb on the lit side and the terminator,
 * a half-ellipse whose width follows the lit fraction.
 */
function MoonGlyph({ lit, waxing }: { lit: number; waxing: boolean }) {
  const r = 7;
  const c = 8;
  const rx = Math.max(0.01, r * Math.abs(1 - 2 * lit));
  const limb = waxing ? 1 : 0;
  const term = lit > 0.5 === waxing ? 1 : 0;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
      <circle cx={c} cy={c} r={r} fill="currentColor" fillOpacity="0.18" />
      <path
        d={`M${c} ${c - r}A${r} ${r} 0 0 ${limb} ${c} ${c + r}A${rx.toFixed(2)} ${r} 0 0 ${term} ${c} ${c - r}Z`}
        fill="currentColor"
      />
    </svg>
  );
}

const SEASON_LABEL: Record<Season, string> = {
  spring: "Spring",
  summer: "Summer",
  autumn: "Autumn",
  winter: "Winter",
};

/**
 * The footer's account of the sky: what hour it is painting, which season,
 * and tonight's real moon — plus the two controls that do not belong in the
 * header. The mood switch stays the one thing to press up top; this is where
 * a curious visitor can preview the other seasons, or hand the sky back to
 * their clock after picking a mood.
 */
export default function SkyAlmanac() {
  const { mood, season, auto, seasonAuto, moon, followClock, setSeason } = useMood();
  const hour = moods.find((m) => m.id === mood)?.label.toLowerCase();

  return (
    <div className="space-y-3">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8rem] text-muted">
        <span className="basis-full sm:basis-auto">
          {auto || !hour ? "The sky follows your local time" : `You set the sky to ${hour}`}
          {season ? (
            <>
              {" · "}
              <span className="text-accent">{season}</span>
              {!seasonAuto && <span className="text-muted"> (preview)</span>}
            </>
          ) : (
            // Before hydration, CSS names the season straight from <html>.
            <span className="season-name" />
          )}
        </span>
        {moon && (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="max-sm:hidden">
              ·
            </span>
            <MoonGlyph lit={moon.lit} waxing={moon.waxing} />
            {/* Mid-sentence on a wide footer; its own line, capitalised, on a phone. */}
            <span className="max-sm:first-letter:uppercase">
              {moon.name}, {Math.round(moon.lit * 100)}% lit tonight
            </span>
          </span>
        )}
      </p>
      {!auto && (
        <button
          type="button"
          onClick={followClock}
          className="inline-flex min-h-[1.75rem] items-center gap-1.5 text-[0.8rem] text-accent transition-opacity duration-300 hover:opacity-75"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <circle cx="12" cy="12" r="8.5" />
              <path d="M12 7.5V12l3 2" />
            </g>
          </svg>
          Follow my clock again
        </button>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        <span id="season-label" className="text-[0.75rem] text-muted">
          Season
        </span>
        <div role="radiogroup" aria-labelledby="season-label" className="dock flex items-center gap-0.5 p-1">
          {([null, ...seasons] as (Season | null)[]).map((s, i, options) => {
            const active = s === null ? seasonAuto : !seasonAuto && season === s;
            const current = seasonAuto ? 0 : Math.max(0, options.indexOf(season));
            const label = s === null ? "Follow the calendar" : `Preview ${SEASON_LABEL[s].toLowerCase()}`;
            return (
              <button
                key={s ?? "auto"}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={i === current ? 0 : -1}
                onKeyDown={(e) => radioKeys(e, options.length, current, (n) => setSeason(options[n]))}
                title={label}
                onClick={() => setSeason(s)}
                className={`inline-flex size-7 items-center justify-center rounded-full transition-colors duration-300 ${
                  active ? "bg-accent text-accent-contrast" : "text-muted hover:bg-panel-hover hover:text-fg"
                }`}
              >
                <SeasonIcon id={s ?? "auto"} />
                <span className="sr-only">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
