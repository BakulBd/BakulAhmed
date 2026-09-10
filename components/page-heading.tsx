import type { ReactNode } from "react";

/** Page title with the gradient rule beneath it. */
export function PageHeading({ children, lead }: { children: ReactNode; lead?: string }) {
  return (
    <header className="mb-10 md:mb-14" data-reveal>
      <h1 className="text-[clamp(2.2rem,6vw,3.6rem)] font-bold leading-[1.05] tracking-[-0.035em] text-fg">
        {children}
      </h1>
      <span className="rule mt-5" aria-hidden="true" />
      {lead && <p className="mt-6 max-w-2xl text-[0.98rem] leading-[1.8] text-muted">{lead}</p>}
    </header>
  );
}

/** Secondary heading used inside a page. */
export function SectionHeading({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`text-[1.35rem] font-semibold tracking-[-0.02em] text-fg md:text-[1.6rem] ${className}`}>
      {children}
    </h2>
  );
}
