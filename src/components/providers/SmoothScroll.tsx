"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { ReactLenis, type LenisRef } from "lenis/react";
import { ScrollTrigger } from "@/lib/gsap";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** Subscribe to the reduced-motion preference without a setState-in-effect. */
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCED_MOTION);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false // server snapshot: assume motion is allowed
  );
}

/**
 * Lenis smooth scrolling. Lenis drives its own RAF loop (autoRaf) so wheel /
 * trackpad input always advances the scroll, and we keep GSAP ScrollTrigger in
 * sync by updating it on every Lenis scroll event. `anchors` makes in-page hash
 * links (e.g. /about#team) scroll smoothly. Disabled under reduced motion.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);
  const enabled = !usePrefersReducedMotion();

  useEffect(() => {
    if (!enabled) return;
    const lenis = lenisRef.current?.lenis;
    if (!lenis) return;

    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);
    return () => lenis.off("scroll", onScroll);
  }, [enabled]);

  if (!enabled) return <>{children}</>;

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{ autoRaf: true, anchors: true, lerp: 0.1, duration: 1.1 }}
    >
      {children}
    </ReactLenis>
  );
}
