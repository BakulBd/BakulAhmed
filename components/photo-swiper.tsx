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
 * No chrome at all: no arrows, no dots, no counter, no progress rail. The
 * portraits turn over on their own like a card being flipped, and the frame
 * itself is the control — click or tap it, swipe it, or focus it and use the
 * arrow keys. Two photographs of the same person do not need a widget; a
 * progress bar over someone's face only reads as something still loading.
 *
 * Auto-advance pauses on hover, on focus, while dragging and when the tab is
 * hidden, and never starts at all under reduced motion (WCAG 2.2.2), where the
 * flip also collapses to a plain swap.
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
        aria-label={
          count > 1
            ? "Portraits of Bakul Ahmed — click, swipe or use the arrow keys to turn to the next"
            : "Portrait of Bakul Ahmed"
        }
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onClick={() => count > 1 && go(index + 1)}
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
                className="object-cover object-center"
              />
            ) : (
              <GeneratedScene index={i} />
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
