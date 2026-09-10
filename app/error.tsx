"use client";

import { useEffect } from "react";

/**
 * Route-level error boundary. Kept deliberately self-contained — it must not
 * depend on providers or data that might be the thing that failed.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[route error]", error);
  }, [error]);

  return (
    <div className="panel mx-auto mt-8 max-w-xl p-7 md:p-9">
      <h1 className="text-[1.6rem] font-bold tracking-[-0.03em] text-fg">
        Something went wrong
      </h1>
      <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">
        This section failed to load. Trying again usually fixes it.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-[0.75rem] text-muted/70">
          Reference: {error.digest}
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="btn-shine inline-flex items-center rounded-xl bg-accent px-5 py-3 text-[0.88rem] font-semibold text-accent-contrast transition-transform duration-300 hover:-translate-y-0.5"
        >
          Try again
        </button>
        <a
          href="/"
          className="tile inline-flex items-center px-5 py-3 text-[0.88rem] font-medium text-soft transition-colors duration-300 hover:text-accent"
        >
          Back to the start
        </a>
      </div>
    </div>
  );
}
