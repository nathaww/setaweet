"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, useGSAP } from "@/lib/gsap";

export type MarqueeImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

/**
 * Full-bleed infinite photo marquee for the Story page. The track holds two
 * copies of the strip and loops seamlessly (xPercent -50); hovering slows the
 * drift so a photo can be viewed. Under reduced motion the strip is a plain,
 * manually scrollable row.
 */
export function MilestoneMarquee({ images }: { images: MarqueeImage[] }) {
  const wrap = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = wrap.current;
      const track = el?.querySelector<HTMLElement>("[data-track]");
      if (!el || !track) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tween = gsap.to(track, {
          xPercent: -50,
          duration: images.length * 2.5,
          ease: "none",
          repeat: -1,
        });
        const slow = () => gsap.to(tween, { timeScale: 0.15, duration: 0.6 });
        const resume = () => gsap.to(tween, { timeScale: 1, duration: 0.6 });
        el.addEventListener("pointerenter", slow);
        el.addEventListener("pointerleave", resume);
        return () => {
          el.removeEventListener("pointerenter", slow);
          el.removeEventListener("pointerleave", resume);
          tween.kill();
        };
      });

      // Reduced motion: no drift; the row scrolls by hand and the duplicate
      // copy is dropped.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        el.style.overflowX = "auto";
        el.querySelectorAll<HTMLElement>("[data-dupe]").forEach((n) => (n.style.display = "none"));
      });
    },
    { scope: wrap, dependencies: [images.length] }
  );

  return (
    <div
      ref={wrap}
      aria-label="Photographs from Setaweet's 10th anniversary celebration"
      className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
      }}
    >
      <div data-track className="flex w-max gap-4 pr-4 md:gap-6 md:pr-6">
        {[false, true].map((dupe) =>
          images.map((image, i) => (
            <figure
              key={`${dupe}-${image.src}`}
              data-dupe={dupe || undefined}
              aria-hidden={dupe || undefined}
              className="photo-card h-[46vh] max-h-105 min-h-70 shrink-0"
              style={{ aspectRatio: `${image.width} / ${image.height}` }}
            >
              <Image
                src={image.src}
                alt={dupe ? "" : image.alt}
                width={image.width}
                height={image.height}
                sizes="(max-width: 768px) 70vw, 40vw"
                loading={i < 4 ? "eager" : "lazy"}
                draggable={false}
                className="h-full w-full object-cover"
              />
            </figure>
          ))
        )}
      </div>
    </div>
  );
}
