"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * Magnetic hover: the element eases toward the cursor while hovered and
 * springs back on leave. Disabled for reduced motion and coarse pointers.
 * `strength` ~ how far it travels (px-ish multiplier).
 */
export function useMagnetic<T extends HTMLElement = HTMLButtonElement>(strength = 0.4) {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();
      mm.add(
        "(prefers-reduced-motion: no-preference) and (pointer: fine)",
        () => {
          const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
          const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });

          const onMove = (e: MouseEvent) => {
            const rect = el.getBoundingClientRect();
            const relX = e.clientX - (rect.left + rect.width / 2);
            const relY = e.clientY - (rect.top + rect.height / 2);
            xTo(relX * strength);
            yTo(relY * strength);
          };
          const onLeave = () => {
            xTo(0);
            yTo(0);
          };

          el.addEventListener("mousemove", onMove);
          el.addEventListener("mouseleave", onLeave);
          return () => {
            el.removeEventListener("mousemove", onMove);
            el.removeEventListener("mouseleave", onLeave);
          };
        }
      );
    },
    { scope: ref, dependencies: [] }
  );

  return ref;
}
