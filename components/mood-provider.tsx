"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Mood } from "@/lib/content";
import { MOOD_KEY, SEASON_KEY, sky, type MoonPhase, type Season } from "@/lib/mood";

type Ctx = {
  mood: Mood["id"] | null;
  season: Season | null;
  /** True while the sky follows the visitor's clock rather than a choice. */
  auto: boolean;
  /** True while the season follows the calendar rather than a preview. */
  seasonAuto: boolean;
  moon: MoonPhase | null;
  setMood: (id: Mood["id"]) => void;
  followClock: () => void;
  setSeason: (id: Season | null) => void;
};

const MoodContext = createContext<Ctx>({
  mood: null,
  season: null,
  auto: true,
  seasonAuto: true,
  moon: null,
  setMood: () => {},
  followClock: () => {},
  setSeason: () => {},
});

export const useMood = () => useContext(MoodContext);

/** Matches <meta name="theme-color"> to the sky currently painted. */
function syncThemeColor() {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--sky-a").trim();
  if (!value) return;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = value;
}

const store = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — the choice just won't persist */
  }
};

/**
 * Owns the single piece of global state on the site: the sky.
 *
 * The blocking head script has already painted it, and left its clock on
 * window.__sky. This reads the result back so the UI never disagrees with the
 * page, and keeps it live: while the sky follows the visitor's clock the sun
 * creeps along its strip minute by minute, and the hour turns over on its own
 * — leave the tab open at 4:59pm and dusk falls at 5.
 */
export default function MoodProvider({ children }: { children: ReactNode }) {
  // The head script drew today's moon; redraw only when the date moves on.
  const drawnFor = useRef(typeof window === "undefined" ? "" : new Date().toDateString());
  const [state, setState] = useState<Omit<Ctx, "setMood" | "followClock" | "setSeason">>({
    mood: null,
    season: null,
    auto: true,
    seasonAuto: true,
    moon: null,
  });

  /** Re-read <html> after a paint, so React state is whatever the page shows. */
  const sync = useCallback((moon?: MoonPhase) => {
    const root = document.documentElement;
    const core = sky();
    let seasonAuto = true;
    try {
      seasonAuto = !core?.isSeason(localStorage.getItem(SEASON_KEY));
    } catch {
      /* no storage, so nothing was chosen */
    }
    setState({
      mood: (root.getAttribute("data-mood") as Mood["id"]) ?? null,
      season: (root.getAttribute("data-season") as Season) ?? null,
      auto: root.getAttribute("data-sky") !== "manual",
      seasonAuto,
      moon: moon ?? core?.moon(new Date()) ?? null,
    });
  }, []);

  const repaint = useCallback(
    (mood: Mood["id"] | null, season: Season | null) => {
      const core = sky();
      if (!core) return;
      const root = document.documentElement;
      const now = new Date();
      const auto = mood === null;
      const m = mood ?? core.mood(now.getHours());
      const se = season ?? core.season(now.getMonth());
      sync(core.paint(root, m, se, auto, now));
      // A page left open past midnight gets the next night's moon.
      const day = now.toDateString();
      if (day !== drawnFor.current) {
        drawnFor.current = day;
        core.drawMoon(document.querySelector<HTMLCanvasElement>(".scene__moon"), now);
      }
      // Keep the browser chrome in step with the sky, so the status bar on a
      // phone matches the mood — once now, and again when the grade lands.
      syncThemeColor();
      window.setTimeout(syncThemeColor, 3200);
    },
    [sync],
  );

  const chosen = useCallback(() => {
    const core = sky();
    let mood: Mood["id"] | null = null;
    let season: Season | null = null;
    try {
      const m = localStorage.getItem(MOOD_KEY);
      const s = localStorage.getItem(SEASON_KEY);
      if (core?.isMood(m)) mood = m as Mood["id"];
      if (core?.isSeason(s)) season = s as Season;
    } catch {
      /* nothing stored */
    }
    return { mood, season };
  }, []);

  useEffect(() => {
    sync();
    // The sky is mid-transition on first paint; settle the chrome after it.
    const settle = window.setTimeout(syncThemeColor, 3200);

    // The clock keeps running. Re-paint once a minute, and the moment a
    // backgrounded tab comes back, so a sky left open goes on telling time.
    const tick = () => {
      if (document.hidden) return;
      const { mood, season } = chosen();
      if (mood !== null && season !== null) return;
      repaint(mood, season);
    };
    const id = window.setInterval(tick, 60_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearTimeout(settle);
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [sync, chosen, repaint]);

  const setMood = useCallback(
    (id: Mood["id"]) => {
      store(MOOD_KEY, id);
      repaint(id, chosen().season);
    },
    [repaint, chosen],
  );

  const followClock = useCallback(() => {
    store(MOOD_KEY, null);
    repaint(null, chosen().season);
  }, [repaint, chosen]);

  const setSeason = useCallback(
    (id: Season | null) => {
      store(SEASON_KEY, id);
      repaint(chosen().mood, id);
    },
    [repaint, chosen],
  );

  return (
    <MoodContext.Provider value={{ ...state, setMood, followClock, setSeason }}>{children}</MoodContext.Provider>
  );
}
