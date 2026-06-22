"use client";

import { createContext, useContext, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";

type ScrollProgressApi = {
  /** Manually set progress (0–1) — used by the horizontal project reader. */
  setProgress: (n: number) => void;
  /** Take over (true) / release (false) the bar from the default Lenis driver. */
  setManual: (manual: boolean) => void;
};

const ScrollProgressContext = createContext<ScrollProgressApi | null>(null);
export const useScrollProgress = () => useContext(ScrollProgressContext);

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Provides a top-center reading-progress bar. By default it tracks Lenis's
 * global scroll progress; the project reader takes over (setManual) so the bar
 * reflects horizontal content progress and reaches 100% at the last panel.
 */
export function ScrollProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState(0);
  const manual = useRef(false);
  const showBar = usePathname() !== "/"; // single-screen home has no progress

  useLenis((lenis) => {
    if (!manual.current) setProgress(clamp01(lenis.progress || 0));
  });

  const api = useMemo<ScrollProgressApi>(
    () => ({
      setProgress: (n) => setProgress(clamp01(n)),
      setManual: (m) => {
        manual.current = m;
        if (!m) setProgress(0);
      },
    }),
    []
  );

  return (
    <ScrollProgressContext.Provider value={api}>
      {showBar && (
        <div className="pointer-events-none fixed left-1/2 top-2.5 z-50 h-[3px] w-40 -translate-x-1/2 overflow-hidden rounded-full bg-paper/15">
          <div
            className="h-full rounded-full bg-paper"
            style={{ width: `${progress * 100}%`, transition: "width 120ms linear" }}
          />
        </div>
      )}
      {children}
    </ScrollProgressContext.Provider>
  );
}
