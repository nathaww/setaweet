/**
 * Build a compact, layered SVG map for the Impact Map: Ethiopia in focus,
 * sitting inside its East African neighbourhood.
 *
 * Inputs (scripts/, fetched once from geoBoundaries gbOpen + Natural Earth):
 *   eth-ADM0.geojson  national outline        -> bright focus border + land
 *   eth-ADM1.geojson  regions (11)            -> hoverable fills + inner lines
 *   eth-ADM2.geojson  zones (74)              -> thin mesh
 *   eth-ADM3.geojson  woredas (690)           -> hairline mesh (zoom-gated)
 *   ne_10m_admin_0_countries.geojson          -> surrounding countries
 *   ne_10m_rivers_lake_centerlines.geojson
 *   ne_10m_roads.geojson                      -> major routes only
 *
 * The frame is Ethiopia's extent expanded by MARGIN so neighbours fill the
 * surrounding space. Neighbour polygons are clipped to that frame so we don't
 * ship geometry for the whole of Sudan. Everything is simplified (RDP) and
 * stroke-only layers are flattened to a single path each.
 *
 *   node --stack-size=8000 scripts/build-ethiopia-map.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const IN = (f) => resolve(__dirname, f);
const OUT = resolve(__dirname, "../src/content/ethiopia-map.json");

const WIDTH = 1000;
const PAD = 10;
/** How far past Ethiopia the frame extends, as a fraction of its span. */
const MARGIN = 0.25;
/** Natural Earth roads with scalerank above this are dropped. */
const ROAD_MAX_RANK = 6;

const REGION_META = {
  "Addis Ababa": { slug: "addis-ababa", name: "Addis Ababa" },
  Afar: { slug: "afar", name: "Afar" },
  Amhara: { slug: "amhara", name: "Amhara" },
  "Beneshangul Gumu": { slug: "benishangul-gumuz", name: "Benishangul-Gumuz" },
  "Dire Dawa": { slug: "dire-dawa", name: "Dire Dawa" },
  Gambela: { slug: "gambela", name: "Gambela" },
  Hareri: { slug: "harari", name: "Harari" },
  Oromia: { slug: "oromia", name: "Oromia" },
  SNNPR: { slug: "snnpr", name: "SNNPR" },
  Somali: { slug: "somali", name: "Somali" },
  Tigray: { slug: "tigray", name: "Tigray" },
};

const load = (f) => JSON.parse(readFileSync(IN(f), "utf8"));
const adm1 = load("eth-ADM1.geojson");

// --- frame: Ethiopia's extent, expanded --------------------------------
let eMinLon = 180, eMaxLon = -180, eMinLat = 90, eMaxLat = -90;
const scan = (c) => {
  if (typeof c[0] === "number") {
    eMinLon = Math.min(eMinLon, c[0]); eMaxLon = Math.max(eMaxLon, c[0]);
    eMinLat = Math.min(eMinLat, c[1]); eMaxLat = Math.max(eMaxLat, c[1]);
  } else c.forEach(scan);
};
adm1.features.forEach((f) => scan(f.geometry.coordinates));

const lonPad = (eMaxLon - eMinLon) * MARGIN;
const latPad = (eMaxLat - eMinLat) * MARGIN;
const minLon = eMinLon - lonPad, maxLon = eMaxLon + lonPad;
const minLat = eMinLat - latPad, maxLat = eMaxLat + latPad;

const centerLat = (minLat + maxLat) / 2;
const kx = Math.cos((centerLat * Math.PI) / 180);
const px = (lon) => lon * kx;
const py = (lat) => -lat;
const pMinX = px(minLon), pMaxX = px(maxLon);
const pMinY = py(maxLat), pMaxY = py(minLat);
const scale = (WIDTH - PAD * 2) / (pMaxX - pMinX);
const HEIGHT = Math.round((pMaxY - pMinY) * scale + PAD * 2);
const projX = (lon) => PAD + (px(lon) - pMinX) * scale;
const projY = (lat) => PAD + (py(lat) - pMinY) * scale;

const r1 = (n) => Math.round(n * 10) / 10;

// --- Ramer-Douglas-Peucker ------------------------------------------------
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  let maxD = 0, idx = 0;
  const [ax, ay] = pts[0];
  const [bx, by] = pts[pts.length - 1];
  const dx = bx - ax, dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < pts.length - 1; i++) {
    const [cx, cy] = pts[i];
    const d = Math.abs(dy * cx - dx * cy + bx * ay - by * ax) / len;
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD <= eps) return [pts[0], pts[pts.length - 1]];
  return [
    ...rdp(pts.slice(0, idx + 1), eps).slice(0, -1),
    ...rdp(pts.slice(idx), eps),
  ];
}

function ringPath(ring, eps, close) {
  let coords = ring;
  if (close && coords.length > 2) {
    const a = coords[0], b = coords[coords.length - 1];
    if (a[0] === b[0] && a[1] === b[1]) coords = coords.slice(0, -1);
  }
  const pts = rdp(coords.map(([lon, lat]) => [projX(lon), projY(lat)]), eps);
  if (pts.length < (close ? 3 : 2)) return "";
  let d = "", lx = null, ly = null;
  for (const [x0, y0] of pts) {
    const x = r1(x0), y = r1(y0);
    if (x === lx && y === ly) continue;
    d += (d ? "L" : "M") + x + " " + y;
    lx = x; ly = y;
  }
  if (!d || d.indexOf("L") === -1) return "";
  return close ? d + "Z" : d;
}

function areaPath(geom, eps) {
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  let d = "";
  for (const poly of polys) for (const ring of poly) d += ringPath(ring, eps, true);
  return d;
}

function linePath(geom, eps) {
  const lines =
    geom.type === "LineString" ? [geom.coordinates] :
    geom.type === "MultiLineString" ? geom.coordinates : [];
  let d = "";
  for (const line of lines) d += ringPath(line, eps, false);
  return d;
}

function meshPath(fc, eps) {
  let d = "";
  for (const f of fc.features) d += areaPath(f.geometry, eps);
  return d;
}

// --- Sutherland-Hodgman clip of a ring to the frame rect ------------------
function clipRing(ring) {
  const edges = [
    { inside: (p) => p[0] >= minLon, isect: (a, b) => lerpX(a, b, minLon) },
    { inside: (p) => p[0] <= maxLon, isect: (a, b) => lerpX(a, b, maxLon) },
    { inside: (p) => p[1] >= minLat, isect: (a, b) => lerpY(a, b, minLat) },
    { inside: (p) => p[1] <= maxLat, isect: (a, b) => lerpY(a, b, maxLat) },
  ];
  function lerpX(a, b, x) {
    const t = (x - a[0]) / (b[0] - a[0]);
    return [x, a[1] + t * (b[1] - a[1])];
  }
  function lerpY(a, b, y) {
    const t = (y - a[1]) / (b[1] - a[1]);
    return [a[0] + t * (b[0] - a[0]), y];
  }
  let out = ring;
  for (const e of edges) {
    const input = out;
    out = [];
    for (let i = 0; i < input.length; i++) {
      const cur = input[i];
      const prev = input[(i + input.length - 1) % input.length];
      const curIn = e.inside(cur), prevIn = e.inside(prev);
      if (curIn) {
        if (!prevIn) out.push(e.isect(prev, cur));
        out.push(cur);
      } else if (prevIn) {
        out.push(e.isect(prev, cur));
      }
    }
    if (!out.length) return [];
  }
  return out;
}

function clippedAreaPath(geom, eps) {
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  let d = "";
  for (const poly of polys) {
    for (const ring of poly) {
      const clipped = clipRing(ring);
      if (clipped.length >= 3) d += ringPath(clipped, eps, true);
    }
  }
  return d;
}

const hitsFrame = (geom) => {
  const walk = (c) => {
    if (typeof c[0] === "number")
      return c[0] >= minLon && c[0] <= maxLon && c[1] >= minLat && c[1] <= maxLat;
    return c.some(walk);
  };
  return walk(geom.coordinates);
};

function lineLayer(file, eps, filter) {
  if (!existsSync(IN(file))) return "";
  const fc = load(file);
  let d = "";
  for (const f of fc.features) {
    if (!f.geometry || !hitsFrame(f.geometry)) continue;
    if (filter && !filter(f.properties)) continue;
    d += linePath(f.geometry, eps);
  }
  return d;
}

// --- build layers ---------------------------------------------------------
const ethiopia = existsSync(IN("eth-ADM0.geojson"))
  ? load("eth-ADM0.geojson").features.map((f) => areaPath(f.geometry, 0.22)).join("")
  : "";

const regions = adm1.features
  .map((f) => {
    const raw = f.properties.shapeName;
    const meta = REGION_META[raw] ?? { slug: String(raw).toLowerCase(), name: raw };
    return { slug: meta.slug, name: meta.name, d: areaPath(f.geometry, 0.22) };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

// Surrounding countries as FILL ONLY, clipped to the frame. They are never
// stroked: clipping introduces edges along the frame, which would otherwise
// draw as a rectangle around the map.
let neighbours = "";
if (existsSync(IN("ne_10m_admin_0_countries.geojson"))) {
  const fc = load("ne_10m_admin_0_countries.geojson");
  for (const f of fc.features) {
    const name = f.properties.ADMIN || f.properties.NAME;
    if (name === "Ethiopia") continue;
    if (!f.geometry || !hitsFrame(f.geometry)) continue;
    neighbours += clippedAreaPath(f.geometry, 0.5);
  }
}

// Real national borders as lines — no frame edges, so no rectangle artefact.
// Left unclipped; the SVG viewport crops whatever runs past the frame.
const borders = lineLayer("ne_10m_admin_0_boundary_lines_land.geojson", 0.4);

const zones = existsSync(IN("eth-ADM2.geojson")) ? meshPath(load("eth-ADM2.geojson"), 0.4) : "";
const woredas = existsSync(IN("eth-ADM3.geojson")) ? meshPath(load("eth-ADM3.geojson"), 0.55) : "";
const rivers = lineLayer("ne_10m_rivers_lake_centerlines.geojson", 0.4);
const roads = lineLayer("ne_10m_roads.geojson", 0.4, (p) => (p.scalerank ?? 99) <= ROAD_MAX_RANK);

// Ethiopia's own box in viewBox units — the map opens framed on this.
const ethiopiaBox = {
  x: r1(projX(eMinLon)),
  y: r1(projY(eMaxLat)),
  w: r1(projX(eMaxLon) - projX(eMinLon)),
  h: r1(projY(eMinLat) - projY(eMaxLat)),
};

const out = {
  viewBox: { width: WIDTH, height: HEIGHT },
  projection: { pad: PAD, kx, scale, pMinX, pMinY, centerLat },
  bounds: { minLon, maxLon, minLat, maxLat },
  ethiopiaBox,
  ethiopia,
  regions,
  neighbours,
  borders,
  zones,
  woredas,
  rivers,
  roads,
};

const json = JSON.stringify(out);
writeFileSync(OUT, json);
const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(1) + " KB";
console.log(`wrote ${OUT}`);
console.log(`  viewBox ${WIDTH}x${HEIGHT}  frame lon ${minLon.toFixed(2)}..${maxLon.toFixed(2)} lat ${minLat.toFixed(2)}..${maxLat.toFixed(2)}`);
console.log(`  ethiopia   ${kb(ethiopia)}`);
console.log(`  regions ${regions.length}  ${kb(regions.map((r) => r.d).join(""))}`);
console.log(`  neighbours ${kb(neighbours)}`);
console.log(`  borders    ${kb(borders)}`);
console.log(`  zones      ${kb(zones)}`);
console.log(`  woredas    ${kb(woredas)}`);
console.log(`  rivers     ${kb(rivers)}`);
console.log(`  roads      ${kb(roads)}`);
console.log(`  TOTAL      ${kb(json)}`);
