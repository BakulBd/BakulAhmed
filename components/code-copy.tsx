"use client";

import { useEffect } from "react";

/**
 * One delegated listener for every "Copy" button in a post's code blocks.
 * The buttons are plain markup rendered at build time (lib/blog.ts), so posts
 * stay server components and this is the only script they add.
 */
export default function CodeCopy() {
  useEffect(() => {
    const onClick = async (e: MouseEvent) => {
      const button = (e.target as Element | null)?.closest<HTMLButtonElement>("button[data-copy]");
      if (!button) return;
      const code = button.dataset.copy || button.closest("figure")?.querySelector("pre")?.innerText || "";
      try {
        await navigator.clipboard.writeText(code.replace(/\n$/, ""));
        button.textContent = "Copied";
        button.dataset.copied = "true";
      } catch {
        button.textContent = "Press Ctrl+C";
      }
      window.setTimeout(() => {
        button.textContent = button.dataset.label ?? "Copy";
        delete button.dataset.copied;
      }, 1800);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
