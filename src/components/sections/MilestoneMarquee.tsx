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

      // Seconds per image — lower is faster. Mobile drifts a bit quicker.
      const runMarquee = (perItem: number) => () => {
        const tween = gsap.to(track, {
          xPercent: -50,
          duration: images.length * perItem,
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
      };

      mm.add("(prefers-reduced-motion: no-preference) and (max-width: 767px)", runMarquee(1.6));
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 768px)", runMarquee(2.5));

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
              // Mobile: a fixed near-full-width box at a moderate height; the
              // image is contained (never cropped). md+: a height-based strip
              // where the box matches each photo's aspect ratio.
              className="h-[44vh] w-[86vw] shrink-0 overflow-hidden md:h-[46vh] md:max-h-105 md:min-h-70 md:w-auto"
              style={{ aspectRatio: `${image.width} / ${image.height}` }}
            >
              <Image
                src={image.src}
                alt={dupe ? "" : image.alt}
                width={image.width}
                height={image.height}
                sizes="(max-width: 768px) 86vw, 40vw"
                loading={i < 4 ? "eager" : "lazy"}
                draggable={false}
                className="h-full w-full object-contain md:object-cover"
              />
            </figure>
          ))
        )}
      </div>
    </div>
  );
}
