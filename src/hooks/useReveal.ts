"use client";

import { useRef } from "react";
import { gsap, useGSAP, SplitText } from "@/lib/gsap";

type RevealOptions = {
  /** Split granularity. */
  type?: "chars" | "words" | "lines" | "chars,words";
  stagger?: number;
  duration?: number;
  delay?: number;
  /** Start the animation when the element scrolls into view. */
  onScroll?: boolean;
};

/**
 * SplitText reveal for a heading. Returns a ref to attach to the text element.
 * Honors prefers-reduced-motion (just shows the text). Cleans up via useGSAP.
 */
export function useReveal<T extends HTMLElement = HTMLHeadingElement>(
  options: RevealOptions = {}
) {
  const { type = "chars", stagger = 0.025, duration = 0.8, delay = 0, onScroll = false } = options;
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create(el, { type, autoSplit: true });
        const targets = type.includes("chars") ? split.chars : type.includes("words") ? split.words : split.lines;

        el.classList.remove("reveal-init");
        gsap.from(targets, {
          yPercent: 115,
          opacity: 0,
          rotateX: -80,
          transformOrigin: "50% 100%",
          stagger,
          duration,
          delay,
          ease: "expo.out",
          scrollTrigger: onScroll
            ? { trigger: el, start: "top 85%", once: true }
            : undefined,
        });

        return () => split.revert();
      });

      // Reduced motion: just make sure text is visible.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        el.classList.remove("reveal-init");
      });
    },
    { scope: ref, dependencies: [] }
  );

  return ref;
}
