/**
 * Build a compact SVG-ready map of Ethiopia's regions for the Impact Map.
 *
 * Reads the ADM1 GeoJSON (scripts/eth-adm1.geojson, sourced from geoBoundaries
 * gbOpen ETH ADM1) and projects lon/lat into a fixed SVG viewBox, emitting one
 * path per region plus a shared projection so pins can be placed by real
 * latitude / longitude. Output: src/content/ethiopia-map.json.
 *
 *   node scripts/build-ethiopia-map.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, "eth-adm1.geojson");
const OUT = resolve(__dirname, "../src/content/ethiopia-map.json");

const WIDTH = 1000; // viewBox width; height derived from aspect
const PAD = 24; // padding inside the viewBox

// Friendly, stable display names + slugs (geoBoundaries has a few odd spellings).
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

const geo = JSON.parse(readFileSync(SRC, "utf8"));

// --- bounds --------------------------------------------------------------
let minLon = 180,
  maxLon = -180,
  minLat = 90,
  maxLat = -90;
const scan = (c) => {
  if (typeof c[0] === "number") {
    minLon = Math.min(minLon, c[0]);
    maxLon = Math.max(maxLon, c[0]);
    minLat = Math.min(minLat, c[1]);
    maxLat = Math.max(maxLat, c[1]);
  } else c.forEach(scan);
};
geo.features.forEach((f) => scan(f.geometry.coordinates));

const centerLat = (minLat + maxLat) / 2;
const kx = Math.cos((centerLat * Math.PI) / 180); // shrink longitude toward the pole

// projected (unscaled) bounds
const px = (lon) => lon * kx;
const py = (lat) => -lat;
const pMinX = px(minLon),
  pMaxX = px(maxLon),
  pMinY = py(maxLat),
  pMaxY = py(minLat);

const spanX = pMaxX - pMinX;
const spanY = pMaxY - pMinY;
const scale = (WIDTH - PAD * 2) / spanX;
const HEIGHT = Math.round(spanY * scale + PAD * 2);

// world lon/lat -> svg x/y
const projX = (lon) => PAD + (px(lon) - pMinX) * scale;
const projY = (lat) => PAD + (py(lat) - pMinY) * scale;

const r = (n) => Math.round(n * 10) / 10; // 0.1 svg-unit precision

// --- ring -> "x y x y ..." with light decimation --------------------------
function ringToPath(ring) {
  let d = "";
  let lastX = null,
    lastY = null;
  for (let i = 0; i < ring.length; i++) {
    const x = r(projX(ring[i][0]));
    const y = r(projY(ring[i][1]));
    // drop points that don't move the pen (post-rounding duplicates)
    if (x === lastX && y === lastY) continue;
    d += (d ? "L" : "M") + x + " " + y;
    lastX = x;
    lastY = y;
  }
  return d ? d + "Z" : "";
}

function geomToPath(geom) {
  const polys =
    geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates; // MultiPolygon
  let d = "";
  for (const poly of polys) for (const ring of poly) d += ringToPath(ring);
  return d;
}

const regions = geo.features
  .map((f) => {
    const raw = f.properties.shapeName;
    const meta = REGION_META[raw] ?? { slug: raw.toLowerCase(), name: raw };
    return { slug: meta.slug, name: meta.name, d: geomToPath(f.geometry) };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const out = {
  viewBox: { width: WIDTH, height: HEIGHT },
  // Projection constants so the client can place pins by [lon, lat].
  projection: { pad: PAD, kx, scale, pMinX, pMinY, centerLat },
  bounds: { minLon, maxLon, minLat, maxLat },
  regions,
};

writeFileSync(OUT, JSON.stringify(out));
const bytes = Buffer.byteLength(JSON.stringify(out));
console.log(
  `wrote ${OUT}\n  viewBox ${WIDTH}x${HEIGHT}, ${regions.length} regions, ${(
    bytes / 1024
  ).toFixed(1)} KB`
);
