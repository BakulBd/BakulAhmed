"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { moods, type Mood } from "@/lib/content";
import { MOOD_KEY, moodForHour, themeForMood } from "@/lib/mood";

type Ctx = {
  mood: Mood["id"] | null;
  setMood: (id: Mood["id"]) => void;
};

const MoodContext = createContext<Ctx>({ mood: null, setMood: () => {} });

export const useMood = () => useContext(MoodContext);

/**
 * Owns the single piece of global state on the site. The blocking head script
 * has already applied a mood; this reads it back so the UI never disagrees
 * with the painted page.
 */
/** Matches <meta name="theme-color"> to the sky currently painted. */
function syncThemeColor() {
  const sky = getComputedStyle(document.documentElement).getPropertyValue("--sky-a").trim();
  if (!sky) return;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = sky;
}

export default function MoodProvider({ children }: { children: ReactNode }) {
  const [mood, setMoodState] = useState<Mood["id"] | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-mood");
    const known = moods.some((m) => m.id === current);
    setMoodState(known ? (current as Mood["id"]) : moodForHour(new Date().getHours()));
    // The sky is mid-transition on first paint; settle the chrome after it.
    const id = window.setTimeout(syncThemeColor, 3200);
    return () => window.clearTimeout(id);
  }, []);

  const setMood = useCallback((id: Mood["id"]) => {
    const root = document.documentElement;
    root.setAttribute("data-mood", id);
    root.setAttribute("data-theme", themeForMood(id));
    setMoodState(id);
    try {
      localStorage.setItem(MOOD_KEY, id);
    } catch {
      /* storage unavailable — the choice just won't persist */
    }
    // Keep the browser chrome in step with the sky, so the status bar on a
    // phone matches the mood instead of staying on the night colour.
    syncThemeColor();
  }, []);

  return <MoodContext.Provider value={{ mood, setMood }}>{children}</MoodContext.Provider>;
}
