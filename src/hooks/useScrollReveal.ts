"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

type ScrollRevealOptions = {
  y?: number;
  opacity?: number;
  duration?: number;
  stagger?: number;
  /** CSS selector for staggered children; if omitted the element itself animates. */
  childrenSelector?: string;
  start?: string;
};

/**
 * Fade/translate an element (or its children) into view on scroll.
 * Reduced motion: elements are simply shown.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {}
) {
  const { y = 48, opacity = 0, duration = 1, stagger = 0.08, childrenSelector, start = "top 85%" } = options;
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const targets = childrenSelector ? el.querySelectorAll(childrenSelector) : el;
        gsap.from(targets, {
          y,
          opacity,
          duration,
          stagger: childrenSelector ? stagger : 0,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start, once: true },
        });
      });
    },
    { scope: ref, dependencies: [] }
  );

  return ref;
}
