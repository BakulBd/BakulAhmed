"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, iconMap, type IconName } from "./icons";
import { useMood } from "./mood-provider";
import { MoodIcon } from "./mood-switch";
import { moods, nav } from "@/lib/content";

/**
 * The site's navigation, one component in two forms.
 *
 * Phones: a tab bar along the bottom — icon over label, a pill sliding to the
 * current page. It tucks away while you read downwards, comes back on any
 * upward scroll or at the end of the page, and steps aside while you type so
 * it never sits over a field above the keyboard.
 *
 * Tablets and up: docked into the content panel's top-right corner, as part
 * of the panel. It used to scroll away with the corner, so on a long page
 * there was no way to another page short of scrolling back up. Now it is
 * sticky: once the corner leaves the screen it floats as a glass pill at the
 * top, and gains the two things that scrolled away with the header — back to
 * the top, and the lighting.
 *
 * The indicator is measured from live geometry so it stays aligned at any
 * font size or zoom; on wide screens it follows the pointer to preview where
 * you are about to go, then settles back on the current page.
 */
export default function PanelNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [bar, setBar] = useState<{ left: number; width: number } | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [stuck, setStuck] = useState(false);
  const [tucked, setTuckedState] = useState(false);
  const [typing, setTyping] = useState(false);
  // One source of truth for "tucked", shared by the scroll handler and
  // everything else that shows the bar (a new page, finishing typing). A
  // private copy inside the handler went stale whenever something else showed
  // the bar, and it then refused to tuck again until the next scroll up.
  const tuckedRef = useRef(false);
  const typingRef = useRef(false);
  const travelRef = useRef(0);
  const setTucked = useCallback((v: boolean) => {
    travelRef.current = 0;
    if (tuckedRef.current === v) return;
    tuckedRef.current = v;
    setTuckedState(v);
  }, []);

  // A post at /blog/some-slug still belongs to the Blog tab.
  const current =
    nav.find((item) => item.href !== "/" && pathname.startsWith(`${item.href}/`))?.href ?? pathname;
  const target = hovered ?? current;

  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.querySelector<HTMLElement>(`[data-href="${CSS.escape(target)}"]`);
    if (!item) return setBar(null);
    const a = list.getBoundingClientRect();
    const b = item.getBoundingClientRect();
    setBar({ left: b.left - a.left, width: b.width });
  }, [target]);

  // Latest measure, so the listeners can stay registered once.
  const measureRef = useRef(measure);
  measureRef.current = measure;

  useEffect(() => {
    measure();
  }, [measure]);

  // A new page always arrives with its navigation showing.
  useEffect(() => {
    setTucked(false);
  }, [pathname, setTucked]);

  useEffect(() => {
    const onResize = () => measureRef.current();
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(() => measureRef.current()).catch(() => {});
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // One scroll listener for both forms: the floating state on wide screens,
  // tucking away on phones. rAF-throttled, and state only changes on a real
  // transition, so scrolling re-renders nothing.
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 768px)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lastY = window.scrollY;
    let frame = 0;
    let isStuck = false;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;

      if (wide.matches) {
        const top = navRef.current?.getBoundingClientRect().top ?? 99;
        const next = y > 4 && top <= 12.75;
        if (next !== isStuck) setStuck((isStuck = next));
        setTucked(false);
        return;
      }
      if (isStuck) setStuck((isStuck = false));
      // Scrolling while a field has focus is the browser bringing it into
      // view, not someone reading — it says nothing about the bar.
      if (still.matches || typingRef.current) return;

      const atEnd = window.innerHeight + y >= document.documentElement.scrollHeight - 48;
      if (y < 96 || atEnd) return setTucked(false);
      if (dy > 0) {
        travelRef.current = Math.max(0, travelRef.current) + dy;
        if (travelRef.current > 56) setTucked(true);
      } else if (dy < 0) {
        travelRef.current = Math.min(0, travelRef.current) + dy;
        if (travelRef.current < -20) setTucked(false);
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    wide.addEventListener("change", update);
    return () => {
      window.removeEventListener("scroll", onScroll);
      wide.removeEventListener("change", update);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [setTucked]);

  // While a field has focus on a touch screen, the bar steps aside: above the
  // on-screen keyboard it would sit right over what is being typed.
  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) return;
    const isField = (el: EventTarget | null) =>
      el instanceof HTMLElement && el.matches("input:not([type=checkbox]):not([type=radio]), textarea, select, [contenteditable]");
    const onIn = (e: FocusEvent) => {
      if (!isField(e.target)) return;
      typingRef.current = true;
      setTyping(true);
    };
    // Done typing: the bar comes back where the person is, whatever the
    // keyboard's arrival scrolled.
    const onOut = (e: FocusEvent) => {
      if (!isField(e.target)) return;
      typingRef.current = false;
      setTyping(false);
      setTucked(false);
    };
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
    };
  }, [setTucked]);

  const toTop = () => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: still ? "auto" : "smooth" });
    // The button disappears once the page is back at the top; send focus to
    // the content rather than let it drop to the document.
    document.getElementById("main")?.focus({ preventScroll: true });
  };

  return (
    <nav
      ref={navRef}
      aria-label="Primary"
      className="site-nav"
      data-stuck={stuck || undefined}
      data-hidden={tucked || typing || undefined}
    >
      {/* Beside the pill, not in it: positioned out of flow, so appearing
          moves nothing. Inside, they widened the nav as it floated, and the
          content under it shifted (CLS 0.024 on long pages). */}
      {stuck && (
        <div className="site-nav__extras">
          <button type="button" onClick={toTop} className="site-nav__extra" title="Back to top">
            <ArrowUp width={17} height={17} />
            <span className="sr-only">Back to top</span>
          </button>
          <MoodCycle />
        </div>
      )}

      <ul ref={listRef} onMouseLeave={() => setHovered(null)} className="site-nav__list">
        {bar && (
          <li
            aria-hidden="true"
            className="site-nav__indicator"
            style={{ transform: `translateX(${bar.left}px)`, width: bar.width }}
          >
            <span />
          </li>
        )}
        {nav.map((item) => {
          const active = current === item.href;
          const Icon = iconMap[item.icon as IconName];
          return (
            <li key={item.href} className="site-nav__item">
              <Link
                href={item.href}
                data-href={item.href}
                aria-current={active ? (pathname === item.href ? "page" : "true") : undefined}
                onMouseEnter={() => setHovered(item.href)}
                onFocus={() => setHovered(item.href)}
                onBlur={() => setHovered(null)}
                className="site-nav__link"
              >
                {/* The icon sits in a fixed pod; the sliding pill is drawn to the
                    pod's exact size, so it can never reach the label below. */}
                <span className="site-nav__pod" aria-hidden="true">
                  <Icon className="site-nav__icon" width={20} height={20} />
                </span>
                <span className="site-nav__label">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** The lighting, one press from anywhere on the page once the header is gone. */
function MoodCycle() {
  const { mood, setMood } = useMood();
  const i = Math.max(0, moods.findIndex((m) => m.id === mood));
  const now = moods[i];
  const next = moods[(i + 1) % moods.length];
  const label = `Lighting: ${now.label}. Switch to ${next.label.toLowerCase()}`;
  return (
    <button type="button" onClick={() => setMood(next.id)} className="site-nav__extra" title={label}>
      <MoodIcon id={now.icon} size={17} />
      <span className="sr-only">{label}</span>
    </button>
  );
}
