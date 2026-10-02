import { moods } from "@/lib/content";

/**
 * The hero line, which changes with the lighting.
 *
 * All four lines are in the HTML and CSS shows the one for the current
 * [data-mood], which the head script sets before first paint. It used to wait
 * for React to learn the mood and render the long intro paragraph meanwhile —
 * four lines on a phone collapsing to one on hydration, which shoved the rest
 * of the hero up. Now the right line is there in the first frame, follows a
 * mood change instantly, and ships no JavaScript.
 */
export default function MoodLine() {
  return (
    <span className="mood-line">
      {moods.map((m) => (
        <span key={m.id} data-line={m.id}>
          {m.line}
        </span>
      ))}
    </span>
  );
}
