import { flushSync } from "react-dom";

type WithTransitions = Document & { startViewTransition?: (update: () => void) => unknown };

/**
 * Runs a state update inside a View Transition, so cards that stay glide to
 * their new places and the rest fade, instead of the grid jumping. Each card
 * that should move carries its own `view-transition-name`.
 *
 * Progressive: where the API is missing, or motion is reduced, the update
 * simply happens.
 */
export function withViewTransition(update: () => void) {
  const doc = document as WithTransitions;
  if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    update();
    return;
  }
  doc.startViewTransition(() => flushSync(update));
}
