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
 * Runs before first paint so the page never flashes the wrong sky. Kept as a
 * string because it is inlined into <head>; the logic mirrors the helpers
 * above and they are covered by the same tests.
 */
export const moodScript = `(function(){try{var d=document.documentElement;d.setAttribute('data-js','');
var M={dawn:'dark',day:'dark',dusk:'dark',night:'dark'};
var m=localStorage.getItem('${MOOD_KEY}');
if(!M[m]){var h=new Date().getHours();m=h>=5&&h<9?'dawn':h>=9&&h<17?'day':h>=17&&h<20?'dusk':'night';}
d.setAttribute('data-mood',m);d.setAttribute('data-theme',M[m]);d.style.colorScheme=M[m];}catch(e){}})();`;
