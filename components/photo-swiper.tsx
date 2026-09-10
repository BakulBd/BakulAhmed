"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import GeneratedScene, { SCENE_COUNT } from "./generated-scene";

/** How long each photograph is held before the next one fades in. */
const DWELL_MS = 5200;
const SWIPE_THRESHOLD = 48;

/**
 * The portrait.
 *
 * Presentation over controls: photographs cross-fade on their own, and the
 * only chrome is a hairline rail whose active segment fills as that photo's
 * turn elapses — no arrows, no dots, no counter. The rail segments are still
 * buttons, so the set stays operable by pointer and keyboard, and swipe works
 * on touch.
 *
 * Auto-advance pauses on hover, on focus, while dragging and when the tab is
 * hidden, and never starts at all under reduced motion (WCAG 2.2.2).
 *
 * With `photos` empty it falls back to generated scenes, so the frame is never
 * an empty box before real pictures are added.
 */
export default function PhotoSwiper({
  photos = [],
  className = "",
}: {
  photos?: readonly string[];
  className?: string;
}) {
  const usingPhotos = photos.length > 0;
  const count = usingPhotos ? photos.length : SCENE_COUNT;

  const [index, setIndex] = useState(0);
  const [motion, setMotion] = useState(false);
  const [paused, setPaused] = useState(false);
  const [drag, setDrag] = useState(0);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    setMotion(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  useEffect(() => {
    if (!motion || paused || count < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), DWELL_MS);
    return () => window.clearInterval(id);
  }, [motion, paused, count]);

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (count < 2) return;
    startX.current = e.clientX;
    setPaused(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    setDrag(e.clientX - startX.current);
  };

  const onPointerUp = () => {
    if (startX.current === null) return;
    if (drag <= -SWIPE_THRESHOLD) go(index + 1);
    else if (drag >= SWIPE_THRESHOLD) go(index - 1);
    startX.current = null;
    setDrag(0);
    setPaused(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(index - 1);
    }
  };

  return (
    <div
      className={`swiper ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label="Photographs of Bakul Ahmed"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        className="swiper__stage"
        style={{ transform: drag ? `translateX(${drag * 0.16}px)` : undefined }}
      >
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className="swiper__slide"
            data-active={i === index}
            aria-hidden={i !== index}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
          >
            {usingPhotos ? (
              <Image
                src={photos[i]}
                alt={i === 0 ? "Bakul Ahmed" : ""}
                fill
                sizes="(min-width: 1120px) 320px, (min-width: 640px) 45vw, 80vw"
                priority={i === 0}
                className="object-cover object-[center_35%]"
              />
            ) : (
              <GeneratedScene index={i} />
            )}
          </div>
        ))}
      </div>

      {count > 1 && (
        <div
          className="swiper__rail"
          data-paused={paused || !motion}
          role="group"
          aria-label="Choose a photograph"
        >
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Photograph ${i + 1} of ${count}`}
              aria-current={i === index}
              onClick={() => go(i)}
              className="swiper__seg"
              data-state={i === index ? "active" : i < index ? "past" : "future"}
            >
              {/* The fill animates over this photo's turn. Keyed on index so it
                  restarts cleanly each time rather than resuming mid-way. */}
              <span key={`${i}-${index}`} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
