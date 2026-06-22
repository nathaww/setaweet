"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * Seamless horizontal marquee. Render the track's content TWICE inside the
 * element this ref is attached to; the hook loops by -50%. Pauses on reduced
 * motion. `speed` = seconds per full loop.
 */
export function useMarquee<T extends HTMLElement = HTMLDivElement>(
  speed = 24,
  direction: 1 | -1 = -1
) {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tween = gsap.to(el, {
          xPercent: direction * 50,
          duration: speed,
          ease: "none",
          repeat: -1,
        });
        return () => tween.kill();
      });
    },
    { scope: ref, dependencies: [] }
  );

  return ref;
}
