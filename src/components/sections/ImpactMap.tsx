"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { Minus, Plus, RotateCcw, X, ArrowUpRight } from "lucide-react";
import mapData from "@/content/ethiopia-map.json";
import { MAP_POINTS, type MapPoint } from "@/map-points";
import { projectIndex, projectMetaBySlug } from "@/project-index";

const VB = mapData.viewBox; // { width, height }
const PROJ = mapData.projection; // { pad, kx, scale, pMinX, pMinY }
const MIN_K = 1;
const MAX_K = 9;

/** Project real [lon, lat] into the base SVG coordinate space (pre-transform). */
function project(lon: number, lat: number) {
  return {
    x: PROJ.pad + (lon * PROJ.kx - PROJ.pMinX) * PROJ.scale,
    y: PROJ.pad + (-lat - PROJ.pMinY) * PROJ.scale,
  };
}

type Transform = { k: number; tx: number; ty: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function ImpactMap() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: VB.width, h: VB.height });
  const [t, setT] = useState<Transform>({ k: 1, tx: 0, ty: 0 });
  const [selected, setSelected] = useState<MapPoint | null>(null);
  const [hoverRegion, setHoverRegion] = useState<string | null>(null);
  // Project highlighted from the legend (glows its pin[s] + region).
  const [highlightSlug, setHighlightSlug] = useState<string | null>(null);

  // First location that hosts a given project slug (for legend clicks).
  const pointBySlug = useMemo(() => {
    const m: Record<string, MapPoint> = {};
    for (const p of MAP_POINTS)
      for (const slug of p.projects) if (!m[slug]) m[slug] = p;
    return m;
  }, []);

  // The SVG is "contained" (preserveAspectRatio meet) inside a viewport-capped
  // box, so the whole map is always visible. Derive the fit scale + letterbox
  // offsets; every pixel<->user conversion goes through these.
  const fit = Math.min(size.w / VB.width, size.h / VB.height);
  const ppu = fit; // pixels per SVG user unit
  const offX = (size.w - VB.width * fit) / 2;
  const offY = (size.h - VB.height * fit) / 2;

  // ---- responsive sizing -------------------------------------------------
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ---- transform helpers -------------------------------------------------
  // Clamp panning so the (scaled) map edges never drift inside the viewport.
  const clampT = useCallback((next: Transform): Transform => {
    const { k } = next;
    const minTx = VB.width - VB.width * k;
    const minTy = VB.height - VB.height * k;
    return {
      k,
      tx: clamp(next.tx, minTx, 0),
      ty: clamp(next.ty, minTy, 0),
    };
  }, []);

  // Zoom toward a fixed point given in viewBox-user coords (cu).
  const zoomAt = useCallback(
    (cuX: number, cuY: number, factor: number) => {
      setT((prev) => {
        const k = clamp(prev.k * factor, MIN_K, MAX_K);
        const ratio = k / prev.k;
        return clampT({
          k,
          tx: cuX - (cuX - prev.tx) * ratio,
          ty: cuY - (cuY - prev.ty) * ratio,
        });
      });
    },
    [clampT]
  );

  // pointer pixel -> viewBox-user coord (accounting for letterbox offset)
  const toUser = useCallback(
    (clientX: number, clientY: number) => {
      const rect = wrapRef.current!.getBoundingClientRect();
      return {
        x: (clientX - rect.left - offX) / ppu,
        y: (clientY - rect.top - offY) / ppu,
      };
    },
    [ppu, offX, offY]
  );

  // Scroll-to-zoom is intentionally omitted — zooming is via the buttons (and
  // pinch on touch), so the page keeps scrolling normally over the map.

  // ---- drag pan + pinch zoom (pointer events) ----------------------------
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragState = useRef<{ moved: boolean; startT: Transform } | null>(null);
  const pinchState = useRef<{ dist: number } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      try {
        (e.target as Element).setPointerCapture?.(e.pointerId);
      } catch {
        /* pointer may not be active (e.g. synthetic) — safe to ignore */
      }
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.current.size === 1) {
        dragState.current = { moved: false, startT: t };
      } else if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()];
        pinchState.current = { dist: Math.hypot(a.x - b.x, a.y - b.y) };
      }
    },
    [t]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return;
      const prev = pointers.current.get(e.pointerId)!;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.current.size >= 2 && pinchState.current) {
        const [a, b] = [...pointers.current.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        const { x, y } = toUser(midX, midY);
        zoomAt(x, y, dist / pinchState.current.dist);
        pinchState.current.dist = dist;
        return;
      }

      if (dragState.current) {
        const dx = (e.clientX - prev.x) / ppu;
        const dy = (e.clientY - prev.y) / ppu;
        if (Math.abs(e.clientX - prev.x) + Math.abs(e.clientY - prev.y) > 2)
          dragState.current.moved = true;
        setT((p) => clampT({ k: p.k, tx: p.tx + dx, ty: p.ty + dy }));
      }
    },
    [ppu, toUser, zoomAt, clampT]
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchState.current = null;
    if (pointers.current.size === 0) dragState.current = null;
  }, []);

  const reset = useCallback(() => {
    setT({ k: 1, tx: 0, ty: 0 });
    setSelected(null);
  }, []);

  // Selecting a pin just opens its card — the view stays where the user left it
  // (zoom lives on the buttons / pinch), which keeps things predictable.
  const selectPoint = useCallback((p: MapPoint) => setSelected(p), []);

  // From the legend: open the location that hosts this project, and bring the
  // map into view (the legend sits below it) so the highlighted pin is visible.
  const selectSlug = useCallback(
    (slug: string) => {
      const p = pointBySlug[slug];
      if (!p) return;
      setSelected(p);
      wrapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [pointBySlug]
  );

  // Close the card when clicking anywhere outside a pin / the card / controls.
  useEffect(() => {
    if (!selected) return;
    const onDown = (e: PointerEvent) => {
      const el = e.target as Element | null;
      if (el?.closest(".im-pin, .im-card, .im-controls, .im-legend")) return;
      setSelected(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [selected]);

  // region that should read as "active" (selected / highlighted / hovered)
  const highlightRegion = highlightSlug
    ? pointBySlug[highlightSlug]?.region ?? null
    : null;
  const activeRegion = selected?.region ?? highlightRegion ?? hoverRegion;

  // screen-pixel position of the selected pin (for the anchored card)
  const cardAnchor = useMemo(() => {
    if (!selected) return null;
    const { x, y } = project(selected.lon, selected.lat);
    return {
      left: offX + (x * t.k + t.tx) * ppu,
      top: offY + (y * t.k + t.ty) * ppu,
    };
  }, [selected, t, ppu, offX, offY]);

  return (
    <div className="container-app mt-10 md:mt-14">
      <div
        ref={wrapRef}
        className="relative h-[68svh] max-h-205 min-h-95 w-full touch-none overflow-hidden rounded-xl border border-faint bg-[#0e1413] select-none md:h-[74svh]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <svg
          width={size.w}
          height={size.h}
          viewBox={`0 0 ${VB.width} ${VB.height}`}
          preserveAspectRatio="xMidYMid meet"
          className="block h-full w-full"
          role="img"
          aria-label="Interactive map of Setaweet's work across the regions of Ethiopia"
        >
          <defs>
            <radialGradient id="im-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#027963" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#027963" stopOpacity="0" />
            </radialGradient>
          </defs>

          <g transform={`translate(${t.tx} ${t.ty}) scale(${t.k})`}>
            {/* regions */}
            {mapData.regions.map((r) => {
              const isActive = activeRegion === r.slug;
              return (
                <path
                  key={r.slug}
                  d={r.d}
                  className="transition-colors duration-300"
                  fill={isActive ? "#0c4a40" : "#152420"}
                  stroke={isActive ? "#12b48f" : "#284a41"}
                  strokeWidth={0.8 / t.k}
                  vectorEffect="non-scaling-stroke"
                  onPointerEnter={() => setHoverRegion(r.slug)}
                  onPointerLeave={() =>
                    setHoverRegion((h) => (h === r.slug ? null : h))
                  }
                  style={{ cursor: "pointer" }}
                />
              );
            })}

            {/* pins */}
            {MAP_POINTS.map((p) => {
              const { x, y } = project(p.lon, p.lat);
              const isSel = selected?.id === p.id;
              const isHi =
                !!highlightSlug && p.projects.includes(highlightSlug);
              const single = p.projects.length === 1;
              const meta = single ? projectMetaBySlug[p.projects[0]] : null;
              // single project -> its own indexed colour + number;
              // cluster -> neutral fill + count (so it can't be read as a #)
              const color = meta ? meta.color : "#e9e7e2";
              const label = single ? meta?.n ?? "" : p.projects.length;
              const active = isSel || isHi;
              const base = p.hub ? 9 : 6.5;
              const grow = (active ? 1.25 : 1) / t.k;
              return (
                <g
                  key={p.id}
                  transform={`translate(${x} ${y}) scale(${grow})`}
                  className="im-pin transition-[transform]"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!dragState.current?.moved) selectPoint(p);
                  }}
                  style={{ cursor: "pointer" }}
                  aria-label={`${p.city}: ${p.projects.length} project${
                    p.projects.length > 1 ? "s" : ""
                  }`}
                >
                  {/* soft glow */}
                  <circle r={base * 2.6} fill="url(#im-glow)" opacity={0.9} />
                  {/* pulse ring */}
                  <circle
                    className="im-pulse"
                    r={base}
                    fill="none"
                    stroke={meta ? color : "#12b48f"}
                    strokeWidth={1.5}
                  />
                  {/* dot */}
                  <circle
                    r={base}
                    fill={color}
                    stroke={active ? "#12b48f" : "#0b0b0b"}
                    strokeWidth={active ? 2.75 : 1.5}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={base * 1.1}
                    fontWeight={700}
                    fill="#0b0b0b"
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* anchored project card */}
        {selected && cardAnchor && (
          <PointCard
            point={selected}
            anchor={cardAnchor}
            container={size}
            onClose={() => setSelected(null)}
          />
        )}

        {/* zoom controls */}
        <div className="im-controls absolute right-3 top-3 flex flex-col gap-1.5">
          <ControlButton label="Zoom in" onClick={() => zoomAt(VB.width / 2, VB.height / 2, 1.4)}>
            <Plus size={16} />
          </ControlButton>
          <ControlButton label="Zoom out" onClick={() => zoomAt(VB.width / 2, VB.height / 2, 1 / 1.4)}>
            <Minus size={16} />
          </ControlButton>
          <ControlButton label="Reset view" onClick={reset}>
            <RotateCcw size={15} />
          </ControlButton>
        </div>

        {/* hint */}
        <p className="pointer-events-none absolute bottom-3 left-3 max-w-[60%] text-[0.7rem] leading-snug text-paper/40">
          Drag to pan · pinch or use the buttons to zoom · tap a pin to explore its projects
        </p>
      </div>

      {/* colour-coded index of every project */}
      <div className="mt-8">
        <p className="slab micro text-paper/50">Index · {projectIndex.length} projects</p>
        <ul className="im-legend mt-4 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
          {projectIndex.map((m) => {
            const hasLocation = !!pointBySlug[m.slug];
            return (
              <li key={m.slug}>
                <button
                  type="button"
                  disabled={!hasLocation}
                  onMouseEnter={() => setHighlightSlug(m.slug)}
                  onMouseLeave={() =>
                    setHighlightSlug((s) => (s === m.slug ? null : s))
                  }
                  onClick={() => selectSlug(m.slug)}
                  className="group flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-paper/5 disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <span
                    className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[0.62rem] font-bold text-[#0b0b0b]"
                    style={{ backgroundColor: m.color }}
                  >
                    {m.n}
                  </span>
                  <span className="truncate text-base text-paper/75 group-hover:text-paper">
                    {m.title}
                  </span>
                  <span className="ml-auto shrink-0 text-meta text-paper/35">
                    {m.year}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-md border border-faint bg-ink/70 text-paper/80 backdrop-blur transition-colors hover:border-teal hover:text-paper"
    >
      {children}
    </button>
  );
}

const CARD_W = 300;
const GAP = 14; // space between pin and card

function PointCard({
  point,
  anchor,
  container,
  onClose,
}: {
  point: MapPoint;
  anchor: { left: number; top: number };
  container: { w: number; h: number };
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(0);

  // Measure the card so we can keep the whole thing on-screen (the project list
  // makes it tall for hubs). Re-measure when the point changes.
  useLayoutEffect(() => {
    if (cardRef.current) setH(cardRef.current.offsetHeight);
  }, [point]);

  const maxLeft = Math.max(12, container.w - CARD_W - 12);
  const left = clamp(anchor.left + 16, 12, maxLeft);

  // Flip above the pin when there isn't room below; clamp fully inside.
  const roomBelow = container.h - anchor.top;
  const above = h > 0 && roomBelow < h + GAP;
  const rawTop = above ? anchor.top - h - GAP : anchor.top + GAP;
  const maxTop = Math.max(12, container.h - h - 12);
  const top = h > 0 ? clamp(rawTop, 12, maxTop) : anchor.top + GAP;

  return (
    <div
      ref={cardRef}
      className="im-card absolute z-20 w-75 max-w-[calc(100%-24px)] rounded-lg border border-faint bg-coal/95 p-4 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.9)] backdrop-blur"
      style={{ left, top, visibility: h === 0 ? "hidden" : "visible" }}
      role="dialog"
      aria-label={`Projects in ${point.city}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="slab micro text-teal">{point.city}</p>
          <p className="mt-1 text-meta text-paper/50">
            {point.projects.length} project{point.projects.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="-mr-1 -mt-1 grid h-7 w-7 place-items-center rounded-full text-paper/50 hover:bg-paper/5 hover:text-paper"
        >
          <X size={15} />
        </button>
      </div>

      <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto pr-1" data-lenis-prevent>
        {point.projects.map((slug) => {
          const proj = projectMetaBySlug[slug];
          if (!proj) return null;
          return (
            <li key={slug}>
              <Link
                href={`/projects/${slug}`}
                className="group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-base text-paper/80 transition-colors hover:bg-paper/5 hover:text-paper"
              >
                <span
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[0.62rem] font-bold text-[#0b0b0b]"
                  style={{ backgroundColor: proj.color }}
                >
                  {proj.n}
                </span>
                <span className="truncate">
                  {proj.title}
                  <span className="ml-2 text-meta text-paper/40">{proj.year}</span>
                </span>
                <ArrowUpRight
                  size={15}
                  className="ml-auto shrink-0 text-paper/30 transition-colors group-hover:text-teal"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
