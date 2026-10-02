"use client";

import { useEffect, useState } from "react";
import { sky } from "@/lib/mood";

const ZONE = "Asia/Dhaka";
const PART_OF_DAY = { dawn: "dawn", day: "daytime", dusk: "evening", night: "night" } as const;

/**
 * What time it is where he is, in the site's own sky vocabulary — useful to
 * anyone deciding whether to expect a reply tonight. Rendered after mount
 * (the server cannot know the visitor's "now"); until then it holds the
 * timezone, so nothing on the line jumps.
 */
export default function LocalTime({ variant = "short" }: { variant?: "short" | "sentence" }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  // Both forms fit one line down to 320px, placeholder and real, so swapping
  // one for the other on mount moves nothing below it.
  if (!now) {
    return <span>{variant === "short" ? "Dhaka · GMT+6" : "Dhaka, Bangladesh · GMT+6"}</span>;
  }

  const time = new Intl.DateTimeFormat("en-US", { timeZone: ZONE, hour: "numeric", minute: "2-digit" }).format(now);
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: ZONE, hour: "2-digit", hourCycle: "h23" }).format(now),
  );
  const part = PART_OF_DAY[sky()?.mood(hour) ?? (hour >= 6 && hour < 18 ? "day" : "night")];

  if (variant === "short") {
    return (
      <span>
        <time dateTime={now.toISOString()}>{time}</time> in Dhaka
      </span>
    );
  }
  return (
    <span>
      <time dateTime={now.toISOString()} className="text-fg">
        {time}
      </time>{" "}
      in Dhaka · {part} there
    </span>
  );
}
