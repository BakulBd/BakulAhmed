import type { ReactNode } from "react";

/**
 * The surface every inner-page section sits on, so Resume, Portfolio, Blog and
 * Contact read as composed as the home grid rather than floating on the page.
 */
export default function Card({
  children,
  className = "",
  reveal = true,
  delay = 0,
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  reveal?: boolean;
  delay?: number;
  /** id of the heading inside, so the section is exposed as a named region */
  labelledBy?: string;
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={`panel shine shine--panel spotlight p-6 sm:p-7 md:p-9 ${className}`}
      {...(reveal ? { "data-reveal": true } : {})}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </section>
  );
}
