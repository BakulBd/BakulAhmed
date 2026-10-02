"use client";

import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";

/**
 * Re-keys on navigation so the panel content animates in on each tab change.
 *
 * Not on the first load: fading the whole page in from opacity 0 held back the
 * first paint of everything on it, which is exactly what LCP measures. Arriving
 * at a page should be instant; the settle is for moving between tabs.
 */
export default function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const initial = useRef(pathname);
  const moved = useRef(false);
  if (pathname !== initial.current) moved.current = true;

  return (
    <div key={pathname} className={moved.current ? "route-enter" : undefined}>
      {children}
    </div>
  );
}
