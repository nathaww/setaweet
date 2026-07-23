"use client";

import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import { gsap } from "@/lib/gsap";

const BLOCKS = 20;

type PageTransitionContextValue = {
  /** Returns true if the transition started, false if it was a no-op (already
   *  transitioning, or navigating to the current path). */
  navigate: (url: string) => boolean;
};
const PageTransitionContext = createContext<PageTransitionContextValue | null>(null);

export function usePageTransition() {
  const ctx = useContext(PageTransitionContext);
  if (!ctx) throw new Error("usePageTransition must be used within <PageTransition>");
  return ctx;
}

/**
 * GSAP "blocks wipe" page transition (ported from the Codegrid reference).
 * Internal navigations cover the screen with staggered blocks + the Setaweet
 * mark, then route, then reveal. Programmatic navigation is exposed via
 * `usePageTransition().navigate` so it can be triggered from scroll, too.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useLenis();

  const overlay = useRef<HTMLDivElement>(null);
  const blocks = useRef<HTMLDivElement[]>([]);
  const transitioning = useRef(false);
  const firstMount = useRef(true);

  // Initial state: blocks hidden.
  useEffect(() => {
    gsap.set(blocks.current, { scaleX: 0, transformOrigin: "left" });
  }, []);

  const reveal = useCallback(() => {
    if (overlay.current) overlay.current.style.pointerEvents = "auto";
    gsap.set(blocks.current, { scaleX: 1, transformOrigin: "right" });
    gsap.to(blocks.current, {
      scaleX: 0,
      duration: 0.5,
      stagger: 0.02,
      ease: "power3.out",
      transformOrigin: "right",
      onComplete: () => {
        transitioning.current = false;
        if (overlay.current) overlay.current.style.pointerEvents = "none";
      },
    });
  }, []);

  const navigate = useCallback(
    (url: string) => {
      if (transitioning.current || url === pathname) return false;
      transitioning.current = true;
      if (overlay.current) overlay.current.style.pointerEvents = "auto";

      gsap.timeline({ onComplete: () => router.push(url) }).to(blocks.current, {
        scaleX: 1,
        duration: 0.5,
        stagger: 0.02,
        ease: "power3.out",
        transformOrigin: "left",
      });
      return true;
    },
    [pathname, router]
  );

  // Reveal the new page after each route change (skip the very first load so it
  // doesn't fight the Preloader). Also reset scroll to the top.
  useEffect(() => {
    if (firstMount.current) {
      firstMount.current = false;
      return;
    }
    lenis?.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);
    reveal();
  }, [pathname, reveal, lenis]);

  // Intercept internal link clicks so they play the transition.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor || anchor.target === "_blank") return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href === pathname) return;
      e.preventDefault();
      navigate(href);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [navigate, pathname]);

  return (
    <PageTransitionContext.Provider value={{ navigate }}>
      <div ref={overlay} aria-hidden className="pointer-events-none fixed inset-0 z-9998 flex">
        {Array.from({ length: BLOCKS }).map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) blocks.current[i] = el;
            }}
            className="h-full flex-1 origin-left scale-x-0 bg-paper"
          />
        ))}
      </div>
      {children}
    </PageTransitionContext.Provider>
  );
}
