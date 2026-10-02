"use client";

import { useEffect } from "react";

/**
 * One delegated listener for every copy button on the site: the "Copy" on a
 * post's code blocks and its "Copy link", and the email tile's icon button.
 * The buttons are plain markup (the code ones rendered at build time by
 * lib/blog.ts), so posts stay server components and this is the only script
 * they add.
 *
 * Text buttons say "Copied" in place of their label. Icon buttons
 * ([data-icon]) keep their icons — CSS swaps the glyph on [data-copied] or
 * [data-copy-failed] — and say it through a hidden live label instead.
 */
export default function CodeCopy() {
  useEffect(() => {
    const timers = new WeakMap<HTMLButtonElement, number>();

    const onClick = async (e: MouseEvent) => {
      const button = (e.target as Element | null)?.closest<HTMLButtonElement>("button[data-copy]");
      if (!button) return;
      const code = button.dataset.copy || button.closest("figure")?.querySelector("pre")?.innerText || "";
      const label = button.hasAttribute("data-icon")
        ? button.querySelector<HTMLElement>("[data-copy-label]")
        : button;
      // The resting label is read once, before the first change, and kept —
      // read on every click, a second click inside the reset window saved
      // "Copied" as the label to go back to.
      const resting = (button.dataset.label ??= label?.textContent ?? "Copy");
      window.clearTimeout(timers.get(button));
      try {
        await navigator.clipboard.writeText(code.replace(/\n$/, ""));
        if (label) label.textContent = "Copied";
        delete button.dataset.copyFailed;
        button.dataset.copied = "true";
      } catch {
        if (label) label.textContent = "Press Ctrl+C";
        delete button.dataset.copied;
        button.dataset.copyFailed = "true";
      }
      timers.set(
        button,
        window.setTimeout(() => {
          if (label) label.textContent = resting;
          delete button.dataset.copied;
          delete button.dataset.copyFailed;
        }, 1800),
      );
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
