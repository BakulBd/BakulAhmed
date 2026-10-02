import type { KeyboardEvent } from "react";

/**
 * Arrow-key behaviour for a `role="radiogroup"` of buttons — the WAI-ARIA
 * radio pattern. The group is one Tab stop (only the checked option has
 * tabIndex 0); arrows move the selection and focus together, wrapping at the
 * ends; Home and End jump to the first and last. Without this each option was
 * its own Tab stop and the arrows did nothing, which is not how a radio group
 * is announced to a screen reader.
 */
export function radioKeys(event: KeyboardEvent<HTMLElement>, count: number, index: number, select: (i: number) => void) {
  let next = -1;
  switch (event.key) {
    case "ArrowRight":
    case "ArrowDown":
      next = (index + 1) % count;
      break;
    case "ArrowLeft":
    case "ArrowUp":
      next = (index - 1 + count) % count;
      break;
    case "Home":
      next = 0;
      break;
    case "End":
      next = count - 1;
      break;
    default:
      return;
  }
  event.preventDefault();
  select(next);
  const radios = event.currentTarget.closest("[role=radiogroup]")?.querySelectorAll<HTMLElement>("[role=radio]");
  radios?.[next]?.focus();
}
