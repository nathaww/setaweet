"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { gsap, useGSAP, SplitText } from "@/lib/gsap";
import { useReveal } from "@/hooks/useReveal";
import { projects as ALL } from "@/data";
import { useSearch } from "@/components/providers/SearchProvider";
import { usePageTransition } from "@/components/providers/PageTransition";
import { Plate } from "@/components/ui/Plate";
import { cn } from "@/lib/utils";

const SPACING = 0.56; // center-to-center gap as a fraction of card width
const WINDOW = 3; // cards rendered each side of center (rest are parked/hidden)

/**
 * Home coverflow. The focused cover is sharp & centered (untouched browse) or
 * aligned left once the user searches or sorts, so a sorted run reads as an
 * ordered sequence from the first slide; neighbours scale, dim and blur.
 * Draggable, arrow/keyboard navigable. Search comes from the Navbar; one icon
 * sorts by year. Clicking the focused cover opens its project.
 */
export function HeroSlider() {
  const { navigate } = usePageTransition();
  const { debouncedQuery } = useSearch();
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  // Whether the user has explicitly sorted. Browse opens centered; sorting (or
  // searching) switches to a left-aligned rail that reads as an ordered run.
  const [sortTouched, setSortTouched] = useState(false);
  const headline = useReveal<HTMLHeadingElement>({ type: "chars", stagger: 0.02, delay: 0.1 });

  const q = debouncedQuery.trim().toLowerCase();
  const slides = useMemo(() => {
    const filtered = q
      ? ALL.filter(
          (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
        )
      : ALL;
    return [...filtered].sort((a, b) => (dir === "asc" ? a.year - b.year : b.year - a.year));
  }, [q, dir]);

  // Untouched browse is centered on the middle cover. Searching or sorting
  // switches to a left-aligned rail that starts on the first slide of the order
  // (lowest year for asc, highest for desc) so the sequence reads left→right and
  // the direction is obvious.
  const filtering = q !== "";
  const align: "center" | "left" = filtering || sortTouched ? "left" : "center";
  const focus = (len: number) => (align === "left" ? 0 : Math.floor(len / 2));

  const [active, setActive] = useState(() => focus(slides.length));
  const firstLayout = useRef(true);
  const viewport = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);
  const dragging = useRef(false);
  const pointerId = useRef<number | null>(null);
  const startX = useRef(0);
  const moved = useRef(0);

  const key = slides.map((p) => p.slug).join("|");
  const clamp = (n: number) => Math.max(0, Math.min(slides.length - 1, n));
  const goTo = (n: number) => setActive(clamp(n));
  const step = () => (cards.current.find(Boolean)?.offsetWidth ?? 300) * SPACING;

  // Refocus when the result set / alignment changes. Adjusting state during
  // render (rather than in an effect) keeps `active` in range within the same
  // commit, so children never see a stale index pointing past the new slides.
  const resetSignal = `${key}__${align}`;
  const [prevSignal, setPrevSignal] = useState(resetSignal);
  if (resetSignal !== prevSignal) {
    setPrevSignal(resetSignal);
    setActive(focus(slides.length));
  }

  const layoutCards = (pos: number, animate: boolean) => {
    const cw = cards.current.find(Boolean)?.offsetWidth ?? 300;
    const s = cw * SPACING;
    const w = viewport.current?.offsetWidth ?? 0;
    const baseX = align === "left" ? -w / 2 + cw / 2 + cw * 0.12 : 0;
    // Mobile shows only the centered image; desktop fans out the neighbours.
    const win = w && w < 768 ? 0 : WINDOW;

    cards.current.forEach((card, i) => {
      if (!card) return;
      const d = i - pos;
      const abs = Math.abs(d);
      const hidden = abs > win + 0.5;
      const props = {
        x: baseX + d * s,
        scale: hidden ? 0.5 : gsap.utils.clamp(0.55, 1, 1 - abs * 0.16),
        // Full opacity for every visible card — only blur differentiates the
        // off-center ones. Cards beyond the window are hidden entirely.
        autoAlpha: hidden ? 0 : 1,
        filter: `blur(${hidden ? 0 : gsap.utils.clamp(0, 6, abs * 3.5)}px)`,
        zIndex: 100 - Math.round(abs * 10),
      };
      if (animate) gsap.to(card, { ...props, duration: 0.7, ease: "expo.out", overwrite: "auto" });
      else gsap.set(card, props);
    });
  };

  // First paint snaps into place (no animation) so cards don't briefly pile up
  // stacked at center; subsequent changes animate.
  useGSAP(
    () => {
      layoutCards(active, !firstLayout.current);
      firstLayout.current = false;
    },
    { dependencies: [active, align, key], scope: viewport }
  );

  useGSAP(
    () => {
      const onResize = () => layoutCards(active, false);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    },
    { dependencies: [active, align, key], scope: viewport }
  );

  // Staggered entrance when the result set changes (search / sort transition).
  useGSAP(
    () => {
      gsap.from("[data-card-inner]", {
        autoAlpha: 0,
        yPercent: 14,
        duration: 0.6,
        stagger: 0.05,
        ease: "expo.out",
      });
    },
    { dependencies: [key], scope: viewport }
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-no-drag]")) {
      pointerId.current = null; // don't leave a stale id from a prior gesture
      return;
    }
    pointerId.current = e.pointerId;
    startX.current = e.clientX;
    moved.current = 0;
    dragging.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (pointerId.current !== e.pointerId) return;
    const dx = e.clientX - startX.current;
    if (!dragging.current) {
      if (Math.abs(dx) < 6) return;
      dragging.current = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
    }
    moved.current = dx;
    layoutCards(clamp(active - dx / step()), false);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (pointerId.current !== e.pointerId) return;
    pointerId.current = null;
    if (!dragging.current) return;
    dragging.current = false;
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {}
    const target = clamp(Math.round(active - moved.current / step()));
    layoutCards(target, true);
    setActive(target);
  };

  const onCardClick = (i: number, slug: string) => {
    if (Math.abs(moved.current) > 6) return;
    if (i === active) navigate(`/projects/${slug}`);
    else goTo(i);
  };

  // Keep the active thumbnail centered in the minimap strip.
  useEffect(() => {
    thumbs.current[active]?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active]);

  // Split-text reveal of the year + title whenever the focused project
  // changes; same character treatment as the page headline.
  useGSAP(
    () => {
      const el = caption.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create(el.querySelectorAll("[data-split]"), { type: "chars" });
        gsap.from(split.chars, {
          yPercent: 115,
          opacity: 0,
          rotateX: -80,
          transformOrigin: "50% 100%",
          stagger: 0.018,
          duration: 0.6,
          ease: "expo.out",
        });
        return () => split.revert();
      });
    },
    { dependencies: [active, key] }
  );

  const current = slides[active];

  return (
    <section className="relative flex min-h-svh flex-col items-center justify-center overflow-x-clip pt-[calc(var(--nav-h)+1.5rem)] pb-16 md:pb-24">
      {/* Wordmark */}
      <div className="container-app flex flex-col items-center gap-3 text-center">
        <h1
          ref={headline}
          className="reveal-init wordmark flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-paper"
        >
          <span
            className="slab leading-none text-paper/70"
            style={{ fontSize: "calc(var(--text-wordmark) * 0.36)" }}
          >
            2014 —
          </span>
          <span className="leading-none" style={{ fontSize: "var(--text-wordmark)" }}>
            THE SETAWEET ARCHIVE
          </span>
          <span
            className="slab leading-none text-paper/70"
            style={{ fontSize: "calc(var(--text-wordmark) * 0.36)" }}
          >
            — 2026
          </span>
        </h1>
        <p className="max-w-xl text-meta text-paper/55">
          Browse, access, and download the Setaweet Movement&rsquo;s archive of research,
          publications, and multimedia.
        </p>
      </div>

      {/* Sort by year — single icon */}
      <button
        type="button"
        onClick={() => {
          setSortTouched(true);
          setDir((d) => (d === "asc" ? "desc" : "asc"));
        }}
        aria-label={dir === "asc" ? "Sort by year: oldest first" : "Sort by year: newest first"}
        title={dir === "asc" ? "Oldest first" : "Newest first"}
        className="absolute right-(--gutter) top-[calc(var(--nav-h)+0.5rem)] grid h-9 w-9 cursor-pointer place-items-center text-paper/60 transition-colors hover:text-paper"
      >
        {dir === "asc" ? <ArrowUpNarrowWide size={18} /> : <ArrowDownWideNarrow size={18} />}
      </button>

      {/* Coverflow */}
      <div
        ref={viewport}
        role="group"
        aria-roledescription="carousel"
        aria-label="Archive projects"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            goTo(active + 1);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            goTo(active - 1);
          } else if (e.key === "Enter" && current) {
            navigate(`/projects/${current.slug}`);
          }
        }}
        className="relative my-10 flex h-[clamp(16rem,42vw,30rem)] w-full cursor-grab touch-pan-y select-none items-center justify-center overflow-hidden outline-none active:cursor-grabbing md:my-14"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {slides.map((project, i) => (
            <button
              key={project.slug}
              ref={(el) => {
                cards.current[i] = el;
              }}
              onClick={() => onCardClick(i, project.slug)}
              aria-label={`${project.title}, ${project.year}`}
              aria-current={i === active}
              draggable={false}
              className="absolute aspect-3/2 h-full cursor-pointer will-change-transform"
            >
              <span data-card-inner className="photo-card block h-full w-full overflow-hidden">
                <Plate
                  image={project.cover}
                  tone={i}
                  priority={i === active}
                  eager={Math.abs(i - active) <= WINDOW}
                  sizes="(max-width: 768px) 85vw, 42vw"
                />
              </span>
            </button>
          ))}
        </div>

        {/* Arrows */}
        <button
          data-no-drag
          aria-label="Previous project"
          onClick={() => goTo(active - 1)}
          disabled={active === 0}
          style={{ zIndex: 120 }}
          className="absolute left-(--gutter) grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-paper/20 bg-ink/40 text-paper backdrop-blur-sm transition hover:bg-paper hover:text-ink disabled:pointer-events-none disabled:opacity-25"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          data-no-drag
          aria-label="Next project"
          onClick={() => goTo(active + 1)}
          disabled={active === slides.length - 1}
          style={{ zIndex: 120 }}
          className="absolute right-(--gutter) grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-paper/20 bg-ink/40 text-paper backdrop-blur-sm transition hover:bg-paper hover:text-ink disabled:pointer-events-none disabled:opacity-25"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Caption · minimap (mobile) · counter (desktop) · Explore */}
      <div className="container-app flex flex-col items-center gap-5">
        {current && (
          // Keyed by slug: SplitText rewrites the DOM inside, so React must
          // remount (not patch) the caption when the focused project changes.
          <div
            key={current.slug}
            ref={caption}
            className="flex flex-col items-center gap-1 overflow-hidden text-center"
          >
            <span data-split className="slab micro text-paper/50">
              {current.year}
            </span>
            <p data-split className="wordmark text-xl text-paper md:text-2xl">
              {current.title}
            </p>
          </div>
        )}
        {slides.length > 1 && (
          <>
            {/* Mobile: thumbnail minimap */}
            <div className="flex max-w-full items-center gap-1.5 overflow-x-auto px-(--gutter) pb-1 md:hidden">
              {slides.map((s, i) => (
                <button
                  key={s.slug}
                  ref={(el) => {
                    thumbs.current[i] = el;
                  }}
                  aria-label={`View ${s.title}`}
                  aria-current={i === active}
                  onClick={() => goTo(i)}
                  className={cn(
                    "relative aspect-3/2 h-9 shrink-0 cursor-pointer overflow-hidden border transition-all duration-300",
                    i === active
                      ? "border-paper opacity-100"
                      : "border-transparent opacity-40 hover:opacity-80"
                  )}
                >
                  <Plate image={s.cover} sizes="120px" tone={i} />
                </button>
              ))}
            </div>

            {/* Desktop: index counter */}
            <div className="micro hidden items-baseline gap-2 text-paper/60 md:flex">
              <span className="text-paper">{String(active + 1).padStart(2, "0")}</span>
              <span className="text-paper/30">/</span>
              <span>{String(slides.length).padStart(2, "0")}</span>
            </div>
          </>
        )}
        {current && (
          <button
            onClick={() => navigate(`/projects/${current.slug}`)}
            className="group inline-flex cursor-pointer items-center gap-2 text-sm text-paper/80 transition-colors hover:text-paper"
          >
            Explore
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
        )}
      </div>
    </section>
  );
}
