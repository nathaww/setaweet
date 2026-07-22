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
import { Minus, Plus, RotateCcw, X, ArrowUpRight, List } from "lucide-react";
import mapData from "@/content/ethiopia-map.json";
import { MAP_POINTS, type MapPoint } from "@/map-points";
import { projectIndex, projectMetaBySlug } from "@/project-index";

const VB = mapData.viewBox; // { width, height }
const PROJ = mapData.projection; // { pad, kx, scale, pMinX, pMinY }
const MIN_K = 1;
const MAX_K = 9;

/** Technical map palette. Canvas comes from the `bg-background` token. */
const C = {
  bg: "var(--color-background)", // canvas token (#0b0b0b)
  // Kept a hair off the canvas so the frame's edge doesn't read as a rectangle.
  neighbour: "#0d0d0d", // surrounding countries
  neighbourLine: "#2b2b2b", // their borders
  land: "#181818", // Ethiopia — deliberately lighter than neighbours
  landActive: "#252525", // hovered / selected region
  outline: "#cfcfcf", // Ethiopia's national border (the focus)
  region: "#3a3a3a", // internal region (ADM1) lines
  zone: "#303030", // zone (ADM2) lines
  woreda: "#1f1f1f", // woreda (ADM3) hairlines
  river: "#24414d", // watercourses
  road: "#3d3428", // roads
  stroke: "#2a2a2a", // UI hairlines
  pin: "#19b98f", // uniform pin green
  pinDeep: "#0d8f6c",
  label: "#8a8a8a", // map label text
  ink: "#f4f3f0", // headings
  surface: "#0e0e0e", // cards / panel
};

/** Project real [lon, lat] into the base SVG coordinate space (pre-transform). */
function project(lon: number, lat: number) {
  return {
    x: PROJ.pad + (lon * PROJ.kx - PROJ.pMinX) * PROJ.scale,
    y: PROJ.pad + (-lat - PROJ.pMinY) * PROJ.scale,
  };
}

type Transform = { k: number; tx: number; ty: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Wrap an uppercase label into at most `max` lines of ~`width` characters. */
function wrapLabel(text: string, width = 13, max = 2) {
  const words = text.toUpperCase().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if (!line) line = w;
    else if ((line + " " + w).length <= width) line += " " + w;
    else {
      lines.push(line);
      line = w;
      if (lines.length === max) break;
    }
  }
  if (line && lines.length < max) lines.push(line);
  return lines.slice(0, max);
}

/**
 * Cloud PNGs from public/map/clouds (transparent white, 400px wide native).
 * `x`/`y` are the top-left in map units (the map is 1000 wide) and `w` the
 * width — kept near native size so they stay soft rather than blurry. Empty
 * this array to fall back to the blurred SVG fog below.
 */
const CLOUD_AR: Record<string, number> = {
  "cloud1.png": 260 / 400,
  "cloud2.png": 192 / 400,
  "cloud3.png": 167 / 400,
};
const CLOUD_IMAGES: {
  file: string;
  x: number;
  y: number;
  w: number;
  o: number;
  b?: boolean;
}[] = [
  // Bottom band only — the upper clouds cluttered the title area.
  { file: "cloud3.png", x: 10, y: 520, w: 500, o: 0.17, b: true },
  { file: "cloud2.png", x: 690, y: 430, w: 470, o: 0.15 },
  { file: "cloud1.png", x: 330, y: 630, w: 400, o: 0.13, b: true },
];

/** Fallback drifting fog blobs, in base map coordinates. */
const CLOUDS = [
  { x: 120, y: 150, rx: 95, ry: 34, o: 0.09, b: false },
  { x: 265, y: 96, rx: 60, ry: 22, o: 0.07, b: true },
  { x: 150, y: 620, rx: 105, ry: 38, o: 0.08, b: true },
  { x: 812, y: 232, rx: 78, ry: 26, o: 0.06, b: false },
  { x: 905, y: 560, rx: 90, ry: 30, o: 0.07, b: true },
  { x: 470, y: 742, rx: 70, ry: 24, o: 0.05, b: false },
];

export function ImpactMap() {
  const wrapRef = useRef<HTMLDivElement>(null);
  /** Set once the user pans/zooms, so auto-framing stops taking over. */
  const userMoved = useRef(false);
  const [size, setSize] = useState({ w: VB.width, h: VB.height });
  const [t, setT] = useState<Transform>({ k: 1, tx: 0, ty: 0 });
  const [selected, setSelected] = useState<MapPoint | null>(null);
  const [hoverRegion, setHoverRegion] = useState<string | null>(null);
  const [highlightSlug, setHighlightSlug] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // First location that hosts a given project slug (for index clicks).
  const pointBySlug = useMemo(() => {
    const m: Record<string, MapPoint> = {};
    for (const p of MAP_POINTS)
      for (const slug of p.projects) if (!m[slug]) m[slug] = p;
    return m;
  }, []);

  // On screens wider than the map we COVER (fill edge to edge, cropping a
  // little top/bottom — Ethiopia still fits); on narrow/portrait screens we
  // CONTAIN so nothing is lost. offX/offY go negative when covering.
  const cover = size.w / size.h > VB.width / VB.height;
  const fit = cover
    ? Math.max(size.w / VB.width, size.h / VB.height)
    : Math.min(size.w / VB.width, size.h / VB.height);
  const ppu = fit;
  const offX = (size.w - VB.width * fit) / 2;
  const offY = (size.h - VB.height * fit) / 2;
  // visible slice of the viewBox, in user units
  const visW = size.w / fit;
  const visH = size.h / fit;

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
  /**
   * Allow panning only as far as the content overflows the visible window,
   * measured symmetrically around the centred position. When the map already
   * fits (no overflow) panning is pinned to centre.
   */
  const clampT = useCallback(
    (next: Transform): Transform => {
      const { k } = next;
      const cx = (VB.width / 2) * (1 - k);
      const cy = (VB.height / 2) * (1 - k);
      const driftX = Math.max(0, (VB.width * k - visW) / 2);
      const driftY = Math.max(0, (VB.height * k - visH) / 2);
      return {
        k,
        tx: clamp(next.tx, cx - driftX, cx + driftX),
        ty: clamp(next.ty, cy - driftY, cy + driftY),
      };
    },
    [visW, visH]
  );

  const zoomAt = useCallback(
    (cuX: number, cuY: number, factor: number) => {
      userMoved.current = true;
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

  // Scroll-to-zoom is intentionally omitted — zoom via buttons / pinch.

  // ---- drag pan + pinch zoom (pointer events) ----------------------------
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragState = useRef<{ moved: boolean } | null>(null);
  const pinchState = useRef<{ dist: number } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    try {
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } catch {
      /* pointer may not be active (e.g. synthetic) — safe to ignore */
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) dragState.current = { moved: false };
    else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchState.current = { dist: Math.hypot(a.x - b.x, a.y - b.y) };
    }
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return;
      const prev = pointers.current.get(e.pointerId)!;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.current.size >= 2 && pinchState.current) {
        const [a, b] = [...pointers.current.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const { x, y } = toUser((a.x + b.x) / 2, (a.y + b.y) / 2);
        zoomAt(x, y, dist / pinchState.current.dist);
        pinchState.current.dist = dist;
        return;
      }

      if (dragState.current) {
        const dx = (e.clientX - prev.x) / ppu;
        const dy = (e.clientY - prev.y) / ppu;
        if (Math.abs(e.clientX - prev.x) + Math.abs(e.clientY - prev.y) > 2) {
          dragState.current.moved = true;
          userMoved.current = true;
        }
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

  /** Transform that frames Ethiopia (not the whole region) in the viewport. */
  const ethiopiaFit = useCallback((): Transform => {
    const box = mapData.ethiopiaBox;
    // 1.15 leaves a margin around the country so edge pins still have room
    // for their labels.
    const k = clamp(
      Math.min(visW / (box.w * 1.15), visH / (box.h * 1.15)),
      MIN_K,
      MAX_K
    );
    // Centre in viewBox space — the letterbox/crop offset is already applied
    // when the SVG is drawn, so using the visible slice here would double-count.
    return clampT({
      k,
      tx: VB.width / 2 - (box.x + box.w / 2) * k,
      ty: VB.height / 2 - (box.y + box.h / 2) * k,
    });
  }, [visW, visH, clampT]);

  // Frame Ethiopia on first layout and on resize, until the user takes over.
  useEffect(() => {
    if (userMoved.current || !size.w || !size.h) return;
    setT(ethiopiaFit());
  }, [size.w, size.h, ethiopiaFit]);

  const reset = useCallback(() => {
    userMoved.current = false;
    setT(ethiopiaFit());
    setSelected(null);
  }, [ethiopiaFit]);

  const selectPoint = useCallback((p: MapPoint) => setSelected(p), []);

  /** Centre the map on a point (used from the index panel). */
  const centerOn = useCallback(
    (p: MapPoint) => {
      const { x, y } = project(p.lon, p.lat);
      setT((prev) => {
        const k = Math.max(prev.k, 1.8);
        return clampT({ k, tx: VB.width / 2 - x * k, ty: VB.height / 2 - y * k });
      });
    },
    [clampT]
  );

  const selectSlug = useCallback(
    (slug: string) => {
      const p = pointBySlug[slug];
      if (!p) return;
      setSelected(p);
      centerOn(p);
      setPanelOpen(false);
    },
    [pointBySlug, centerOn]
  );

  // Close the card when clicking outside a pin / card / controls / panel.
  useEffect(() => {
    if (!selected) return;
    const onDown = (e: PointerEvent) => {
      const el = e.target as Element | null;
      if (el?.closest(".im-pin, .im-card, .im-controls, .im-panel, .im-fab"))
        return;
      setSelected(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [selected]);

  const highlightRegion = highlightSlug
    ? pointBySlug[highlightSlug]?.region ?? null
    : null;
  const activeRegion = selected?.region ?? highlightRegion ?? hoverRegion;

  /**
   * Greedy label placement. Labels are counter-scaled, so their footprint is
   * constant on screen; we lay them out in pixel space and drop any that would
   * collide (denser spots keep the bigger cluster's label, and a hidden label
   * still appears when its pin is selected or highlighted).
   */
  const placements = useMemo(() => {
    const boxes: { x: number; y: number; w: number; h: number }[] = [];
    const res: Record<
      string,
      {
        lines: string[];
        tail: string;
        labelDx: number;
        labelDy: number;
        show: boolean;
      }
    > = {};
    const screen = (p: MapPoint) => {
      const { x, y } = project(p.lon, p.lat);
      return {
        sx: offX + (x * t.k + t.tx) * ppu,
        sy: offY + (y * t.k + t.ty) * ppu,
      };
    };

    // Pins/labels are drawn at a constant on-screen size, so all of this
    // geometry is in CSS pixels — no ppu scaling.
    // Reserve every pin marker first, so a label never lands under a pin.
    for (const p of MAP_POINTS) {
      const { sx, sy } = screen(p);
      const r = (p.hub ? 11 : 9) * 1.3;
      boxes.push({ x: sx - r, y: sy - r, w: r * 2, h: r * 2 });
    }

    // biggest clusters get first pick of the remaining space
    const order = [...MAP_POINTS].sort(
      (a, b) => b.projects.length - a.projects.length
    );
    for (const p of order) {
      const { sx, sy } = screen(p);
      const single = p.projects.length === 1;
      const meta = single ? projectMetaBySlug[p.projects[0]] : null;
      const lines = meta
        ? wrapLabel(meta.title)
        : wrapLabel(p.city.replace(/\s*\(.*\)/, ""));
      const tail = meta ? String(meta.year) : `${p.projects.length} PROJECTS`;
      const maxChars = Math.max(tail.length, ...lines.map((l) => l.length));
      const base = p.hub ? 11 : 9;
      const wL = 11 + maxChars * 5.4;
      const hL = (lines.length + 1) * 10 + 8;
      const below = base * 2.15;
      const above = -below - hL + 8;
      const mid = -hL / 2 + 8;
      // below, above, right, left — first one that is clear wins
      const candidates = [
        { dx: 0, dy: below },
        { dx: 0, dy: above },
        { dx: base * 1.6, dy: mid },
        { dx: -(wL + base * 1.6), dy: mid },
      ];

      let chosen: { dx: number; dy: number } | null = null;
      for (const c of candidates) {
        const box = {
          x: sx + c.dx - 2,
          y: sy + c.dy - 8,
          w: wL,
          h: hL,
        };
        // must sit fully inside the viewport…
        const inView =
          box.x >= 6 &&
          box.y >= 6 &&
          box.x + box.w <= size.w - 6 &&
          box.y + box.h <= size.h - 6;
        // …and not overlap a pin or an already-placed label
        const hits = boxes.some(
          (b) =>
            !(
              box.x + box.w < b.x ||
              b.x + b.w < box.x ||
              box.y + box.h < b.y ||
              b.y + b.h < box.y
            )
        );
        if (inView && !hits) {
          chosen = c;
          boxes.push(box);
          break;
        }
      }
      res[p.id] = {
        lines,
        tail,
        labelDx: chosen?.dx ?? 0,
        labelDy: chosen?.dy ?? below,
        show: chosen !== null,
      };
    }
    return res;
  }, [t, ppu, offX, offY, size.w, size.h]);

  const cardAnchor = useMemo(() => {
    if (!selected) return null;
    const { x, y } = project(selected.lon, selected.lat);
    return {
      left: offX + (x * t.k + t.tx) * ppu,
      top: offY + (y * t.k + t.ty) * ppu,
    };
  }, [selected, t, ppu, offX, offY]);

  return (
    <div
      ref={wrapRef}
      className="bg-background relative w-full touch-none overflow-hidden select-none"
      style={{ height: "calc(100svh - var(--nav-h))" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <svg
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${VB.width} ${VB.height}`}
        preserveAspectRatio={cover ? "xMidYMid slice" : "xMidYMid meet"}
        className="block h-full w-full"
        role="img"
        aria-label="Interactive map of Setaweet's work across the regions of Ethiopia"
      >
        <defs>
          {/* country outline, so rivers/roads never spill past the border */}
          <clipPath id="im-country">
            {mapData.regions.map((r) => (
              <path key={r.slug} d={r.d} />
            ))}
          </clipPath>
          <filter id="im-blur" x="-60%" y="-160%" width="220%" height="420%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <radialGradient id="im-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={C.pin} stopOpacity="0.42" />
            <stop offset="60%" stopColor={C.pin} stopOpacity="0.16" />
            <stop offset="100%" stopColor={C.pin} stopOpacity="0" />
          </radialGradient>
        </defs>

        <g transform={`translate(${t.tx} ${t.ty}) scale(${t.k})`}>
          {/* surrounding East Africa: fill only (a stroke here would trace the
              frame edge as a rectangle), with real borders drawn separately */}
          <path d={mapData.neighbours} fill={C.neighbour} pointerEvents="none" />
          <path
            d={mapData.borders}
            fill="none"
            stroke={C.neighbourLine}
            strokeWidth={0.7}
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
          />

          {/* land fills (hoverable regions) */}
          {mapData.regions.map((r) => {
            const isActive = activeRegion === r.slug;
            return (
              <path
                key={r.slug}
                d={r.d}
                className="transition-colors duration-300"
                fill={isActive ? C.landActive : C.land}
                stroke="none"
                onPointerEnter={() => setHoverRegion(r.slug)}
                onPointerLeave={() =>
                  setHoverRegion((h) => (h === r.slug ? null : h))
                }
                style={{ cursor: "pointer" }}
              />
            );
          })}

          {/* administrative mesh: woredas only once zoomed in, then zones */}
          <g fill="none" pointerEvents="none">
            {t.k >= 1.8 && (
              <path
                d={mapData.woredas}
                stroke={C.woreda}
                strokeWidth={0.4}
                vectorEffect="non-scaling-stroke"
              />
            )}
            <path d={mapData.zones} stroke={C.zone} strokeWidth={0.7} vectorEffect="non-scaling-stroke" />
          </g>

          {/* rivers + roads, clipped to the country outline */}
          <g clipPath="url(#im-country)" fill="none" pointerEvents="none">
            <path d={mapData.rivers} stroke={C.river} strokeWidth={0.7} vectorEffect="non-scaling-stroke" />
            <path d={mapData.roads} stroke={C.road} strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
          </g>

          {/* internal region lines, then Ethiopia's border as the focus */}
          <g fill="none" pointerEvents="none">
            {mapData.regions.map((r) => (
              <path
                key={r.slug}
                d={r.d}
                stroke={C.region}
                strokeWidth={0.8}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {/* soft glow beneath the crisp border */}
            <path
              d={mapData.ethiopia}
              stroke={C.pin}
              strokeOpacity={0.22}
              strokeWidth={7}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={mapData.ethiopia}
              stroke={C.outline}
              strokeWidth={2}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </g>

          {/* clouds — PNGs if supplied, otherwise blurred fog blobs */}
          <g pointerEvents="none">
            {CLOUD_IMAGES.length > 0
              ? CLOUD_IMAGES.map((c, i) => (
                  <image
                    key={i}
                    className={`im-cloud${c.b ? " im-cloud-b" : ""}`}
                    href={`/map/clouds/${c.file}`}
                    x={c.x}
                    y={c.y}
                    width={c.w}
                    height={c.w * (CLOUD_AR[c.file] ?? 0.5)}
                    opacity={c.o}
                    preserveAspectRatio="xMidYMid meet"
                  />
                ))
              : CLOUDS.map((c, i) => (
                  <ellipse
                    key={i}
                    className={`im-cloud${c.b ? " im-cloud-b" : ""}`}
                    filter="url(#im-blur)"
                    cx={c.x}
                    cy={c.y}
                    rx={c.rx}
                    ry={c.ry}
                    fill="#ffffff"
                    opacity={c.o}
                  />
                ))}
          </g>

          {/* pins */}
          {MAP_POINTS.map((p) => {
            const { x, y } = project(p.lon, p.lat);
            const isSel = selected?.id === p.id;
            const isHi = !!highlightSlug && p.projects.includes(highlightSlug);
            const active = isSel || isHi;
            const base = p.hub ? 11 : 9;
            // 1/(k*ppu) cancels both the map zoom and the fit scale, so pins
            // and their labels keep a constant size in CSS pixels.
            const unit = 1 / (t.k * (ppu || 1));
            const place = placements[p.id];
            const lines = place.lines;
            const tail = place.tail;
            const showLabel = place.show || active;
            return (
              <g
                key={p.id}
                transform={`translate(${x} ${y}) scale(${(active ? 1.25 : 1) * unit})`}
                className="im-pin"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!dragState.current?.moved) selectPoint(p);
                }}
                style={{ cursor: "pointer" }}
                aria-label={`${p.city}: ${p.projects.length} project${
                  p.projects.length > 1 ? "s" : ""
                }`}
              >
                {/* soft halo */}
                <circle r={base * 2.4} fill="url(#im-halo)" />
                {/* slow sonar rings */}
                <circle
                  className="im-pulse"
                  r={base}
                  fill="none"
                  stroke={C.pin}
                  strokeWidth={1.6}
                />
                <circle
                  className="im-pulse im-pulse-2"
                  r={base}
                  fill="none"
                  stroke={C.pin}
                  strokeWidth={1.6}
                />
                {/* layered dot */}
                <circle r={base} fill={C.pin} opacity={0.35} />
                <circle
                  r={base * 0.62}
                  fill={active ? C.pinDeep : C.pin}
                  stroke={active ? C.ink : "transparent"}
                  strokeWidth={1.4}
                />

                {/* label */}
                {showLabel && (
                  <g
                    transform={`translate(${place.labelDx - 2} ${place.labelDy})`}
                    // the label is part of the pin's hit target, not inert
                    // knockout outline keeps the type readable over the mesh
                    stroke="#000"
                    strokeWidth={2.6}
                    paintOrder="stroke"
                    strokeLinejoin="round"
                  >
                    <rect x={0} y={-6} width={5.5} height={5.5} fill={C.pin} stroke="none" />
                    {[...lines, tail].map((ln, i) => (
                      <text
                        key={i}
                        x={11}
                        y={i * 10}
                        fontSize={8.4}
                        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                        letterSpacing={0.6}
                        fill={active ? C.ink : C.label}
                      >
                        {ln}
                      </text>
                    ))}
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* title, top-right */}
      <div className="pointer-events-none absolute right-6 top-6 text-right md:right-10 md:top-10">
        <p className="slab micro" style={{ color: C.label }}>
          Reach
        </p>
        <h1
          className="wordmark mt-1"
          style={{ color: C.ink, fontSize: "clamp(1.9rem, 1rem + 3vw, 3.6rem)" }}
        >
          Impact Map
        </h1>
        <p
          className="mt-2 ml-auto max-w-xs text-meta leading-relaxed"
          style={{ color: C.label }}
        >
          A decade of feminist work across Ethiopia. Tap a point to explore its
          projects.
        </p>
      </div>

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
      <div className="im-controls absolute bottom-6 right-6 flex flex-col gap-1.5">
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

      {/* floating index button */}
      <button
        type="button"
        onClick={() => setPanelOpen((v) => !v)}
        aria-expanded={panelOpen}
        className="im-fab absolute left-6 top-6 inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)] transition-transform duration-200 ease-out-expo hover:-translate-y-0.5 active:scale-95 md:left-10 md:top-10"
        style={{ background: C.ink, color: C.bg }}
      >
        <List size={16} />
        Index
        <span className="opacity-60">({projectIndex.length})</span>
      </button>

      {/* hint */}
      <p
        className="pointer-events-none absolute bottom-7 left-1/2 hidden -translate-x-1/2 text-[0.7rem] md:block"
        style={{ color: C.label }}
      >
        Drag to pan · pinch or use the buttons to zoom
      </p>

      <IndexPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        pointBySlug={pointBySlug}
        onSelect={selectSlug}
        onHover={setHighlightSlug}
      />
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
      className="ease-out-expo grid h-9 w-9 cursor-pointer place-items-center rounded-md border backdrop-blur transition duration-200 hover:border-teal active:scale-95"
      style={{ background: "#141918cc", borderColor: C.stroke, color: C.ink }}
    >
      {children}
    </button>
  );
}

function IndexPanel({
  open,
  onClose,
  pointBySlug,
  onSelect,
  onHover,
}: {
  open: boolean;
  onClose: () => void;
  pointBySlug: Record<string, MapPoint>;
  onSelect: (slug: string) => void;
  onHover: (slug: string | null) => void;
}) {
  return (
    <aside
      className={`im-panel ease-out-expo absolute inset-y-0 right-0 z-30 flex w-full max-w-95 flex-col border-l shadow-[-20px_0_50px_-20px_rgba(0,0,0,0.8)] transition-transform duration-500 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ background: C.surface, borderColor: C.stroke }}
      aria-hidden={!open}
    >
      <div
        className="flex items-center justify-between border-b px-5 py-4"
        style={{ borderColor: C.stroke }}
      >
        <p className="slab micro" style={{ color: C.label }}>
          Index · {projectIndex.length} projects
        </p>
        <button
          type="button"
          aria-label="Close index"
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-white/10"
          style={{ color: C.ink }}
        >
          <X size={16} />
        </button>
      </div>

      <ul className="flex-1 overflow-y-auto p-2" data-lenis-prevent>
        {projectIndex.map((m) => {
          const hasLocation = !!pointBySlug[m.slug];
          return (
            <li key={m.slug}>
              <button
                type="button"
                disabled={!hasLocation}
                onMouseEnter={() => onHover(m.slug)}
                onMouseLeave={() => onHover(null)}
                onClick={() => onSelect(m.slug)}
                className="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-white/5 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <span
                  className="w-6 shrink-0 text-[0.7rem] tabular-nums"
                  style={{ color: C.label }}
                >
                  {String(m.n).padStart(2, "0")}
                </span>
                <span className="truncate text-base" style={{ color: C.ink }}>
                  {m.title}
                </span>
                <span
                  className="ml-auto shrink-0 text-meta"
                  style={{ color: C.label }}
                >
                  {m.year}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

const CARD_W = 300;
const GAP = 16;

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

  useLayoutEffect(() => {
    if (cardRef.current) setH(cardRef.current.offsetHeight);
  }, [point]);

  const left = clamp(anchor.left + 18, 12, Math.max(12, container.w - CARD_W - 12));
  const roomBelow = container.h - anchor.top;
  const above = h > 0 && roomBelow < h + GAP;
  const rawTop = above ? anchor.top - h - GAP : anchor.top + GAP;
  const top = h > 0 ? clamp(rawTop, 12, Math.max(12, container.h - h - 12)) : anchor.top + GAP;

  return (
    <div
      ref={cardRef}
      className="im-card absolute z-20 w-75 max-w-[calc(100%-24px)] rounded-lg border p-4 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.45)]"
      style={{
        left,
        top,
        visibility: h === 0 ? "hidden" : "visible",
        background: "#141918f2",
        borderColor: C.stroke,
        backdropFilter: "blur(6px)",
      }}
      role="dialog"
      aria-label={`Projects in ${point.city}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="slab micro" style={{ color: C.pinDeep }}>
            {point.city}
          </p>
          <p className="mt-1 text-meta" style={{ color: C.label }}>
            {point.projects.length} project{point.projects.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="-mr-1 -mt-1 grid h-7 w-7 place-items-center rounded-full transition-colors hover:bg-white/10"
          style={{ color: C.label }}
        >
          <X size={15} />
        </button>
      </div>

      <ul className="mt-3 max-h-64 space-y-0.5 overflow-y-auto pr-1" data-lenis-prevent>
        {point.projects.map((slug) => {
          const proj = projectMetaBySlug[slug];
          if (!proj) return null;
          return (
            <li key={slug}>
              <Link
                href={`/projects/${slug}`}
                className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-base transition-colors hover:bg-white/5"
                style={{ color: C.ink }}
              >
                <span className="truncate">
                  {proj.title}
                  <span className="ml-2 text-meta" style={{ color: C.label }}>
                    {proj.year}
                  </span>
                </span>
                <ArrowUpRight
                  size={15}
                  className="ml-auto shrink-0 opacity-40 transition-opacity group-hover:opacity-100"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
