"use client";

import { createContext, useContext, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";

type ScrollProgressApi = {
  /** Manually set progress (0-1), used by the horizontal project reader. */
  setProgress: (n: number) => void;
  /** Take over (true) / release (false) the bar from the default Lenis driver. */
  setManual: (manual: boolean) => void;
};

const ScrollProgressContext = createContext<ScrollProgressApi | null>(null);
export const useScrollProgress = () => useContext(ScrollProgressContext);

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Provides a top-center reading-progress bar on project detail pages. By
 * default it tracks Lenis's global scroll progress; the project reader takes
 * over (setManual) so the bar reflects horizontal content progress and reaches
 * 100% at the last panel. The bar is written to the DOM directly (no React
 * state, no CSS transition) so it moves in lockstep with the scroll.
 */
export function ScrollProgressProvider({ children }: { children: React.ReactNode }) {
  const bar = useRef<HTMLDivElement>(null);
  const manual = useRef(false);
  const showBar = usePathname().startsWith("/projects/"); // reading progress only on project pages

  useLenis((lenis) => {
    if (!manual.current && bar.current) {
      bar.current.style.width = `${clamp01(lenis.progress || 0) * 100}%`;
    }
  });

  const api = useMemo<ScrollProgressApi>(
    () => ({
      setProgress: (n) => {
        if (bar.current) bar.current.style.width = `${clamp01(n) * 100}%`;
      },
      setManual: (m) => {
        manual.current = m;
        if (!m && bar.current) bar.current.style.width = "0%";
      },
    }),
    []
  );

  return (
    <ScrollProgressContext.Provider value={api}>
      {showBar && (
        <div className="pointer-events-none fixed left-1/2 top-2.5 z-50 h-0.75 w-40 -translate-x-1/2 overflow-hidden rounded-full bg-paper/15">
          <div ref={bar} className="h-full rounded-full bg-paper" style={{ width: "0%" }} />
        </div>
      )}
      {children}
    </ScrollProgressContext.Provider>
  );
}
