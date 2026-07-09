"use client";

import { useEffect, useMemo, useRef } from "react";
import { ArrowRight, ArrowUpRight, FileText, PlayCircle } from "lucide-react";
import { useLenis } from "lenis/react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import type { Project, SubProject } from "@/data";
import { Plate } from "@/components/ui/Plate";
import { Button } from "@/components/ui/Button";
import { usePageTransition } from "@/components/providers/PageTransition";
import { useScrollProgress } from "@/components/layout/ScrollProgress";

/* ----- horizontal panel model ----------------------------------------- */

type MediaSource = Pick<Project, "video" | "audio" | "pdf" | "links" | "website">;

type Block =
  | { kind: "hero" }
  | { kind: "subheader"; sub: SubProject; index: number }
  | { kind: "text"; text: string }
  | { kind: "images"; images: Project["images"] }
  | { kind: "media"; source: MediaSource }
  | { kind: "end" };

/** Interleave a description and gallery into panels: para 1 → images → para 2 →
 *  more images → media. Shared by the project and each of its sub-projects. */
function pushContent(
  blocks: Block[],
  description: string,
  images: Project["images"],
  source: MediaSource
) {
  const paragraphs = description.split(/\n{2,}/);
  if (paragraphs[0]) blocks.push({ kind: "text", text: paragraphs[0] });
  const first = images.slice(0, 3);
  if (first.length) blocks.push({ kind: "images", images: first });
  paragraphs.slice(1).forEach((text) => blocks.push({ kind: "text", text }));
  for (let i = 3; i < images.length; i += 3) {
    blocks.push({ kind: "images", images: images.slice(i, i + 3) });
  }
  if (source.video || source.audio || source.pdf || source.links?.length || source.website) {
    blocks.push({ kind: "media", source });
  }
}

/** Horizontal reading order: hero → project copy/images/media → one subheader +
 *  copy/images/media section per sub-project → end. */
function buildBlocks(project: Project): Block[] {
  const blocks: Block[] = [{ kind: "hero" }];
  pushContent(blocks, project.description, project.images, project);
  project.subProjects?.forEach((sub, i) => {
    blocks.push({ kind: "subheader", sub, index: i + 1 });
    pushContent(blocks, sub.description, sub.images, sub);
  });
  blocks.push({ kind: "end" });
  return blocks;
}

/** How far the reader travels per unit of horizontal swipe (1 = same as vertical scroll). */
const SWIPE_SENSITIVITY = 2;

/* ----- reader ---------------------------------------------------------- */

/**
 * Project reader. On md+ screens it is a horizontal editorial track: vertical
 * scroll (or a horizontal trackpad/mouse swipe) drives it right-to-left; at
 * the end you can keep scrolling (auto-advance) or press the button to move to
 * the next project. On mobile the same blocks render as a plain vertical list.
 */
export function ProjectReader({ project, next }: { project: Project; next: Project }) {
  const { navigate } = usePageTransition();
  const progress = useScrollProgress();
  const lenis = useLenis();
  const lenisRef = useRef(lenis);
  useEffect(() => {
    lenisRef.current = lenis;
  }, [lenis]);
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const navigated = useRef(false);

  const blocks = useMemo(() => buildBlocks(project), [project]);
  const nextUrl = `/projects/${next.slug}`;
  const goNext = () => {
    if (navigated.current) return;
    navigated.current = true;
    navigate(nextUrl);
  };

  useGSAP(
    () => {
      const sec = section.current;
      const tr = track.current;
      if (!sec || !tr) return;
      navigated.current = false;
      gsap.set(tr, { x: 0 });

      const mm = gsap.matchMedia();

      // The pinned horizontal reader only exists on md+; mobile is a plain list.
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 768px)", () => {
        const zone = () => window.innerHeight * 0.6; // "keep scrolling" overscroll
        const total = () => Math.max(1, tr.scrollWidth - window.innerWidth);

        progress?.setManual(true);
        const st = ScrollTrigger.create({
          trigger: sec,
          start: "top top",
          end: () => `+=${total() + zone()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const t = total();
            const dist = (t + zone()) * self.progress;
            gsap.set(tr, { x: -Math.min(dist, t) });
            // Bar reflects content progress — full once the last panel is in view.
            progress?.setProgress(dist / t);
            if (self.progress >= 0.985) goNext();
          },
        });

        // Horizontal trackpad/mouse swipes drive the track too: the sideways
        // delta is re-dispatched as a vertical wheel event straight to window,
        // so Lenis smooths it through the exact same path as vertical scroll.
        // The original event must not reach Lenis (it reads deltaY, 0 here,
        // and re-targets to the current position, cancelling the travel).
        const onWheel = (e: WheelEvent) => {
          if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
          e.preventDefault();
          e.stopPropagation();
          if (lenisRef.current) {
            window.dispatchEvent(
              new WheelEvent("wheel", {
                deltaY: e.deltaX * SWIPE_SENSITIVITY,
                deltaMode: e.deltaMode,
                clientX: e.clientX,
                clientY: e.clientY,
                cancelable: true,
              })
            );
          } else {
            window.scrollBy(0, e.deltaX * SWIPE_SENSITIVITY);
          }
        };
        sec.addEventListener("wheel", onWheel, { passive: false });

        return () => {
          sec.removeEventListener("wheel", onWheel);
          st.kill();
          progress?.setManual(false);
        };
      });

      // Reduced motion (md+): a plain, manually side-scrollable track (no pin).
      mm.add("(prefers-reduced-motion: reduce) and (min-width: 768px)", () => {
        sec.style.height = "auto";
        sec.style.overflowX = "auto";
        return () => {
          sec.style.height = "";
          sec.style.overflowX = "";
        };
      });
    },
    { scope: section, dependencies: [project.slug] }
  );

  return (
    <>
      {/* md+: pinned horizontal reader */}
      <section ref={section} className="relative h-svh overflow-hidden max-md:hidden">
        <div
          ref={track}
          className="flex h-full w-max items-center gap-[4vw] pr-(--gutter) pl-(--gutter) will-change-transform"
        >
          {blocks.map((block, i) => (
            <Panel
              key={`${project.slug}-${i}`}
              block={block}
              project={project}
              next={next}
              first={i === 0}
              onNext={goNext}
            />
          ))}
        </div>
      </section>

      {/* Mobile: the same blocks as a vertical list */}
      <div className="px-(--gutter) pt-[calc(var(--nav-h)+1.5rem)] pb-20 md:hidden">
        <div className="flex flex-col gap-8">
          {blocks.map((block, i) => (
            <MobilePanel
              key={`${project.slug}-m-${i}`}
              block={block}
              project={project}
              next={next}
              onNext={goNext}
            />
          ))}
        </div>
      </div>
    </>
  );
}

/* ----- shared media panel ---------------------------------------------- */

function MediaLinks({ source }: { source: MediaSource }) {
  if (!source.pdf && !source.links?.length && !source.website) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {source.pdf && (
        <Button href={source.pdf} variant="outline" target="_blank" rel="noopener noreferrer">
          <FileText size={16} /> Read document
        </Button>
      )}
      {source.links?.map((href, i) => (
        <Button key={href} href={href} variant="outline" target="_blank" rel="noopener noreferrer">
          <PlayCircle size={16} /> Watch{source.links!.length > 1 ? ` ${i + 1}` : ""}
        </Button>
      ))}
      {source.website && (
        <Button href={source.website} target="_blank" rel="noopener noreferrer">
          Visit website <ArrowUpRight size={16} />
        </Button>
      )}
    </div>
  );
}

/* ----- horizontal panels ------------------------------------------------ */

function Panel({
  block,
  project,
  next,
  first,
  onNext,
}: {
  block: Block;
  project: Project;
  next: Project;
  first: boolean;
  onNext: () => void;
}) {
  switch (block.kind) {
    case "hero":
      return (
        <div className="flex h-full shrink-0 items-center gap-[5vw]">
          <div className="flex flex-col gap-3">
            <span className="micro text-paper/50">{project.year}</span>
            <h1 className="wordmark text-paper" style={{ fontSize: "var(--text-title)" }}>
              {project.title}
            </h1>
          </div>
          {!project.subProjects?.length && (
            <figure className="photo-card aspect-3/2 h-[72vh] shrink-0">
              <Plate image={project.cover} priority={first} sizes="70vw" tone={project.year} />
            </figure>
          )}
        </div>
      );

    case "subheader":
      return (
        <div className="flex h-full shrink-0 items-center gap-[5vw]">
          <div className="flex flex-col gap-3">
            <span className="micro text-paper/50">
              {project.title} #{block.index}
            </span>
            <h2 className="wordmark text-paper" style={{ fontSize: "calc(var(--text-title) * 0.6)" }}>
              {block.sub.title}
            </h2>
          </div>
          {block.sub.cover.src && (
            <figure className="photo-card aspect-3/2 h-[58vh] shrink-0">
              <Plate image={block.sub.cover} sizes="60vw" tone={project.year} />
            </figure>
          )}
        </div>
      );

    case "text":
      return (
        <div className="flex h-full shrink-0 items-center" style={{ width: "min(86vw, 34rem)" }}>
          <p className="text-lead leading-relaxed text-paper/80">{block.text}</p>
        </div>
      );

    case "images":
      return (
        <div className="flex h-full shrink-0 items-center gap-[3vw]">
          {block.images.map((image, i) => (
            <figure key={i} className="photo-card aspect-3/2 h-[58vh] shrink-0">
              <Plate image={image} sizes="60vw" tone={i + 1} />
            </figure>
          ))}
        </div>
      );

    case "media": {
      const source = block.source;
      return (
        <div className="flex h-full shrink-0 flex-col items-start justify-center gap-5">
          {source.video && (
            <figure className="photo-card aspect-3/2 h-[58vh] shrink-0">
              <video
                controls
                preload="metadata"
                className="h-full w-full object-cover"
                src={source.video}
              />
            </figure>
          )}
          {source.audio && (
            <div className="flex w-[min(80vw,26rem)] flex-col gap-2">
              <span className="micro text-paper/50">Listen</span>
              <audio controls preload="none" className="w-full" src={source.audio} />
            </div>
          )}
          <MediaLinks source={source} />
        </div>
      );
    }

    case "end":
      return (
        <div className="flex h-full w-screen shrink-0 flex-col items-center justify-center gap-5 text-center">
          <span className="micro text-paper/50">Next project</span>
          <p className="wordmark text-paper" style={{ fontSize: "var(--text-title)" }}>
            {next.title}
          </p>
          <span className="slab text-paper/50">{next.year}</span>
          <div className="mt-2 flex flex-col items-center gap-4 sm:flex-row">
            <span className="micro flex items-center gap-2 text-paper/40">
              Keep scrolling
              <ArrowRight size={14} className="animate-pulse" />
            </span>
            <NextButton onNext={onNext} />
          </div>
        </div>
      );
  }
}

/* ----- mobile panels ---------------------------------------------------- */

function MobilePanel({
  block,
  project,
  next,
  onNext,
}: {
  block: Block;
  project: Project;
  next: Project;
  onNext: () => void;
}) {
  switch (block.kind) {
    case "hero":
      return (
        <header className="flex flex-col gap-3">
          <span className="micro text-paper/50">{project.year}</span>
          <h1 className="wordmark text-paper" style={{ fontSize: "clamp(2rem, 9vw, 3rem)" }}>
            {project.title}
          </h1>
          {!project.subProjects?.length && (
            <figure className="photo-card mt-2 aspect-3/2 w-full">
              <Plate image={project.cover} priority sizes="92vw" tone={project.year} />
            </figure>
          )}
        </header>
      );

    case "subheader":
      return (
        <div className="mt-4 flex flex-col gap-3 border-t border-faint pt-8">
          <span className="micro text-paper/50">
            {project.title} #{block.index}
          </span>
          <h2 className="wordmark text-paper" style={{ fontSize: "clamp(1.5rem, 7vw, 2.25rem)" }}>
            {block.sub.title}
          </h2>
          {block.sub.cover.src && (
            <figure className="photo-card mt-2 aspect-3/2 w-full">
              <Plate image={block.sub.cover} sizes="92vw" tone={project.year} />
            </figure>
          )}
        </div>
      );

    case "text":
      return <p className="text-base leading-relaxed text-paper/80">{block.text}</p>;

    case "images":
      return (
        <div className="flex flex-col gap-4">
          {block.images.map((image, i) => (
            <figure key={i} className="photo-card aspect-3/2 w-full">
              <Plate image={image} sizes="92vw" tone={i + 1} />
            </figure>
          ))}
        </div>
      );

    case "media": {
      const source = block.source;
      return (
        <div className="flex flex-col items-start gap-5">
          {source.video && (
            <figure className="photo-card w-full overflow-hidden">
              <video controls preload="metadata" className="w-full" src={source.video} />
            </figure>
          )}
          {source.audio && (
            <div className="flex w-full flex-col gap-2">
              <span className="micro text-paper/50">Listen</span>
              <audio controls preload="none" className="w-full" src={source.audio} />
            </div>
          )}
          <MediaLinks source={source} />
        </div>
      );
    }

    case "end":
      return (
        <div className="mt-4 flex flex-col items-center gap-4 border-t border-faint pt-10 text-center">
          <span className="micro text-paper/50">Next project</span>
          <p className="wordmark text-paper" style={{ fontSize: "clamp(1.75rem, 8vw, 2.5rem)" }}>
            {next.title}
          </p>
          <span className="slab text-paper/50">{next.year}</span>
          <NextButton onNext={onNext} />
        </div>
      );
  }
}

function NextButton({ onNext }: { onNext: () => void }) {
  return (
    <button
      type="button"
      onClick={onNext}
      className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-paper px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper/90"
    >
      Next Project
      <ArrowRight size={16} />
    </button>
  );
}
