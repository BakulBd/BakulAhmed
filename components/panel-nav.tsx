"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { nav } from "@/lib/content";

/**
 * Docked into the content panel's top-right corner on wide screens, and a
 * bottom bar on small ones. The underline is measured from live geometry so
 * it stays aligned at any font size or zoom.
 */
export default function PanelNav() {
  const pathname = usePathname();
  const listRef = useRef<HTMLUListElement>(null);
  const [bar, setBar] = useState<{ left: number; width: number } | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  // The underline follows the pointer while hovering, then settles back on the
  // current page — so it previews where you are about to go.
  const target = hovered ?? pathname;

  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.querySelector<HTMLElement>(`[data-href="${CSS.escape(target)}"]`);
    if (!item) return;
    const a = list.getBoundingClientRect();
    const b = item.getBoundingClientRect();
    setBar({ left: b.left - a.left, width: b.width });
  }, [target]);

  // Latest measure, so the resize listener can stay registered once.
  const measureRef = useRef(measure);
  measureRef.current = measure;

  // Re-measure whenever the target changes (navigation or hover).
  useEffect(() => {
    measure();
  }, [measure]);

  // Registered once. Keyed on `measure` it would be torn down and re-added on
  // every hover, which is listener churn for no benefit.
  useEffect(() => {
    const onResize = () => measureRef.current();
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(() => measureRef.current()).catch(() => {});
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <nav
      aria-label="Primary"
      className="navbar-scrim fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[rgb(var(--panel-rgb)/0.9)] backdrop-blur-xl md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-0 md:rounded-bl-2xl md:rounded-tr-[1.2rem] md:border-0 md:border-b md:border-l md:bg-[rgb(var(--tile-rgb)/0.6)]"
    >
      <ul
        ref={listRef}
        onMouseLeave={() => setHovered(null)}
        className="relative mx-auto flex max-w-lg items-center justify-around md:max-w-none md:justify-end md:px-2"
      >
        {bar && (
          <li
            aria-hidden="true"
            className="absolute left-0 top-0 h-[3px] rounded-full grad-accent transition-[transform,width] duration-500 ease-[cubic-bezier(.34,1.4,.5,1)] md:bottom-0 md:top-auto"
            style={{ transform: `translateX(${bar.left}px)`, width: bar.width }}
          />
        )}
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                data-href={item.href}
                aria-current={active ? "page" : undefined}
                onMouseEnter={() => setHovered(item.href)}
                onFocus={() => setHovered(item.href)}
                onBlur={() => setHovered(null)}
                className={`block rounded-lg px-2.5 py-4 text-center text-[0.72rem] font-medium transition-colors duration-300 min-[360px]:px-3 min-[380px]:text-[0.8rem] md:px-4 md:text-[0.875rem] ${
                  active ? "text-accent" : "text-muted hover:bg-panel-hover hover:text-fg"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
