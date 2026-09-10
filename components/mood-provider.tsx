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
export default function MoodProvider({ children }: { children: ReactNode }) {
  const [mood, setMoodState] = useState<Mood["id"] | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-mood");
    const known = moods.some((m) => m.id === current);
    setMoodState(known ? (current as Mood["id"]) : moodForHour(new Date().getHours()));
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
    // No view transition: every mood shares one surface theme, so there is no
    // flip to mask, and a wipe would only fight the slow colour grade.
  }, []);

  return <MoodContext.Provider value={{ mood, setMood }}>{children}</MoodContext.Provider>;
}
