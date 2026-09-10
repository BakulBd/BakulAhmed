import { moods, type Mood } from "./content";

export const MOOD_KEY = "mood";

/** Which mood the visitor's local clock suggests. */
export function moodForHour(hour: number): Mood["id"] {
  if (hour >= 5 && hour < 9) return "dawn";
  if (hour >= 9 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "dusk";
  return "night";
}

/**
 * Every mood is dark. Kept as a function because the surface theme is a
 * separate concern from the mood, and a future light mood would slot in here.
 */
export function themeForMood(id: string): "dark" {
  return moods.find((m) => m.id === id)?.theme ?? "dark";
}

/**
 * Meteorological seasons, northern hemisphere. Derived from the date rather
 * than offered as a control: the site changes quietly through the year while
 * the mood switch stays the one thing to press.
 *
 * A season only touches the scene — a tint over the sky, how hazy the air is,
 * and what falls through it (see [data-season] in globals.css and the fallers
 * in components/constellation.tsx). Accents stay per-mood, so the palette family
 * and its contrast guarantees are unaffected by the date.
 */
export function seasonForMonth(month: number): "spring" | "summer" | "autumn" | "winter" {
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

/**
 * Runs before first paint so the page never flashes the wrong sky. Kept as a
 * string because it is inlined into <head>; the logic mirrors the helpers
 * above and they are covered by the same tests.
 */
export const moodScript = `(function(){try{var d=document.documentElement;d.setAttribute('data-js','');
var M={dawn:'dark',day:'dark',dusk:'dark',night:'dark'};
var m=localStorage.getItem('${MOOD_KEY}');
if(!M[m]){var h=new Date().getHours();m=h>=5&&h<9?'dawn':h>=9&&h<17?'day':h>=17&&h<20?'dusk':'night';}
var mo=new Date().getMonth();
var se=mo>=2&&mo<=4?'spring':mo>=5&&mo<=7?'summer':mo>=8&&mo<=10?'autumn':'winter';
d.setAttribute('data-mood',m);d.setAttribute('data-season',se);d.setAttribute('data-theme',M[m]);d.style.colorScheme=M[m];}catch(e){}})();`;
