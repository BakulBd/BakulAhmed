"use client";

import { ArrowUp } from "./icons";

/**
 * The end of every page offers the way back to its start. Smooth unless the
 * visitor asked for less motion, and focus goes to the content rather than
 * dropping to the document once the button scrolls away.
 */
export default function BackToTop() {
  const toTop = () => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: still ? "auto" : "smooth" });
    document.getElementById("main")?.focus({ preventScroll: true });
  };
  return (
    <button
      type="button"
      onClick={toTop}
      className="group inline-flex min-h-[2rem] items-center gap-1.5 rounded-lg px-2 text-[0.78rem] text-muted transition-colors duration-300 hover:bg-panel-hover hover:text-accent"
    >
      Back to top
      <ArrowUp width={13} height={13} className="transition-transform duration-300 group-hover:-translate-y-0.5" />
    </button>
  );
}
