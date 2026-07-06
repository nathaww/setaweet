"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/** Session flag so the intro plays once per visit (resets when the tab closes). */
const STORAGE_KEY = "setaweet:intro-seen";

/**
 * Intro sequence (screens 1–2): the years "2014 – 2026" fade up, then
 * "THE SETAWEET ARCHIVE" expands between them, and the whole overlay slides
 * away to reveal the page. Plays once per session (sessionStorage), then
 * skipped on refresh / navigation within that session. Skipped under reduced
 * motion.
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLSpanElement>(null);
  const [done, setDone] = useState(false);

  useGSAP(
    () => {
      const el = root.current;
      const titleEl = title.current;
      if (!el || !titleEl) return;

      // Already played on a previous load — skip entirely (runs in a layout
      // effect, so the overlay is removed before paint: no flash).
      let seen = false;
      try {
        seen = sessionStorage.getItem(STORAGE_KEY) === "1";
      } catch {}
      if (seen) {
        setDone(true);
        return;
      }

      // Commit now so a mid-intro refresh won't replay it this session.
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {}

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        setDone(true);
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ onComplete: () => setDone(true) });

        tl.from("[data-year]", {
          yPercent: 60,
          opacity: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: "expo.out",
        })
          .to("[data-dash]", { opacity: 0, width: 0, marginInline: 0, duration: 0.5, ease: "power2.inOut" }, "+=0.35")
          .to(
            titleEl,
            {
              maxWidth: () => titleEl.scrollWidth,
              opacity: 1,
              duration: 1.1,
              ease: "expo.inOut",
            },
            "<"
          )
          .to("[data-year]", { scale: 0.42, duration: 1.1, ease: "expo.inOut" }, "<")
          .to({}, { duration: 0.6 })
          .to(el, { yPercent: -100, duration: 1, ease: "expo.inOut" });
      });
    },
    { scope: root, dependencies: [] }
  );

  if (done) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-9999999 flex items-center justify-center overflow-hidden bg-ink"
    >
      <div className="flex items-center justify-center whitespace-nowrap px-6">
        <span data-year className="slab origin-center text-paper" style={{ fontSize: "var(--text-year)" }}>
          2014
        </span>
        <span data-dash className="slab mx-4 text-paper/80" style={{ fontSize: "var(--text-year)" }}>
          –
        </span>
        <span
          ref={title}
          className="wordmark inline-block overflow-hidden text-paper opacity-0"
          style={{ maxWidth: 0, fontSize: "clamp(1.3rem, 0.7rem + 3vw, 3.5rem)" }}
        >
          THE SETAWEET ARCHIVE
        </span>
        <span data-year className="slab ml-4 origin-center text-paper" style={{ fontSize: "var(--text-year)" }}>
          2026
        </span>
      </div>
    </div>
  );
}
