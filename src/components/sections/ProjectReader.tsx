"use client";

import { useMemo, useRef } from "react";
import { ArrowRight, ArrowUpRight, FileText, PlayCircle } from "lucide-react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import type { Project } from "@/data";
import { Plate } from "@/components/ui/Plate";
import { Button } from "@/components/ui/Button";
import { usePageTransition } from "@/components/providers/PageTransition";
import { useScrollProgress } from "@/components/layout/ScrollProgress";

/* ----- horizontal panel model ----------------------------------------- */

type Block =
  | { kind: "hero" }
  | { kind: "text"; text: string }
  | { kind: "images"; images: Project["images"] }
  | { kind: "media" }
  | { kind: "end" };

/** Interleave the project's copy and images into a horizontal reading order:
 *  hero → para 1 → images → para 2 → more images → media → end. */
function buildBlocks(project: Project): Block[] {
  const paragraphs = project.description.split(/\n{2,}/);
  const images = project.images;
  const blocks: Block[] = [{ kind: "hero" }];

  if (paragraphs[0]) blocks.push({ kind: "text", text: paragraphs[0] });
  const first = images.slice(0, 3);
  if (first.length) blocks.push({ kind: "images", images: first });
  paragraphs.slice(1).forEach((text) => blocks.push({ kind: "text", text }));
  for (let i = 3; i < images.length; i += 3) {
    blocks.push({ kind: "images", images: images.slice(i, i + 3) });
  }
  if (project.video || project.audio || project.pdf || project.links?.length) {
    blocks.push({ kind: "media" });
  }
  blocks.push({ kind: "end" });
  return blocks;
}

/* ----- reader ---------------------------------------------------------- */

/**
 * Horizontal-scroll project reader. Vertical scroll drives the editorial track
 * right-to-left; at the end you can keep scrolling (auto-advance) or press the
 * button to move to the next project. Navigation runs through the page
 * transition. The next project loops back to the first.
 */
export function ProjectReader({ project, next }: { project: Project; next: Project }) {
  const { navigate } = usePageTransition();
  const progress = useScrollProgress();
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

      mm.add("(prefers-reduced-motion: no-preference)", () => {
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

        return () => {
          st.kill();
          progress?.setManual(false);
        };
      });

      // Reduced motion: a plain, manually side-scrollable track (no pin).
      mm.add("(prefers-reduced-motion: reduce)", () => {
        sec.style.height = "auto";
        sec.style.overflowX = "auto";
      });
    },
    { scope: section, dependencies: [project.slug] }
  );

  return (
    <section ref={section} className="relative h-svh overflow-hidden">
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
  );
}

/* ----- panels ---------------------------------------------------------- */

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
          <figure className="photo-card aspect-3/2 h-[72vh] shrink-0">
            <Plate image={project.cover} priority={first} sizes="70vw" tone={project.year} />
          </figure>
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

    case "media":
      return (
        <div className="flex h-full shrink-0 flex-col items-start justify-center gap-5">
          {project.video && (
            <figure className="photo-card aspect-3/2 h-[58vh] shrink-0">
              <video
                controls
                preload="metadata"
                className="h-full w-full object-cover"
                src={project.video}
              />
            </figure>
          )}
          {project.audio && (
            <div className="flex w-[min(80vw,26rem)] flex-col gap-2">
              <span className="micro text-paper/50">Listen</span>
              <audio controls preload="none" className="w-full" src={project.audio} />
            </div>
          )}
          {(project.pdf || project.links?.length) && (
            <div className="flex flex-wrap gap-3">
              {project.pdf && (
                <Button href={project.pdf} variant="outline" target="_blank" rel="noopener noreferrer">
                  <FileText size={16} /> Read document
                </Button>
              )}
              {project.links?.map((href, i) => (
                <Button key={href} href={href} variant="outline" target="_blank" rel="noopener noreferrer">
                  <PlayCircle size={16} /> Watch{project.links!.length > 1 ? ` ${i + 1}` : ""}
                </Button>
              ))}
              {project.website && (
                <Button href={project.website} target="_blank" rel="noopener noreferrer">
                  Visit website <ArrowUpRight size={16} />
                </Button>
              )}
            </div>
          )}
        </div>
      );

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
            <button
              type="button"
              onClick={onNext}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-paper px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper/90"
            >
              Next Project
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      );
  }
}
