"use client";

import { useMood } from "./mood-provider";
import { moods } from "@/lib/content";

/** The hero line, which changes with the lighting. */
export default function MoodLine({ fallback }: { fallback: string }) {
  const { mood } = useMood();
  const line = moods.find((m) => m.id === mood)?.line;
  return <>{line ?? fallback}</>;
}
