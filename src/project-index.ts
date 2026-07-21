/**
 * A stable number + colour for every project, used to colour-code the Impact
 * Map pins, card rows, and the legend index. Numbering follows the project
 * order in src/data.ts (chronological), so #1 is the earliest work.
 */
import { projects } from "@/data";

/** Distinguishable hues that read clearly on the near-black map canvas. */
const PALETTE = [
  "#8b7bff", // 1  violet
  "#4ea1ff", // 2  blue
  "#2ec5b6", // 3  teal
  "#f5a524", // 4  amber
  "#ef5da8", // 5  pink
  "#6ee7b7", // 6  mint
  "#a78bfa", // 7  light violet
  "#38bdf8", // 8  sky
  "#fb923c", // 9  orange
  "#f472b6", // 10 rose
  "#34d399", // 11 emerald
  "#facc15", // 12 yellow
  "#f87171", // 13 red
  "#22d3ee", // 14 cyan
  "#c084fc", // 15 purple
  "#60a5fa", // 16 soft blue
  "#fbbf24", // 17 gold
  "#4ade80", // 18 green
  "#e879f9", // 19 fuchsia
];

export type ProjectIndexEntry = {
  slug: string;
  title: string;
  year: number;
  /** 1-based index shown on pins / legend. */
  n: number;
  color: string;
};

export const projectIndex: ProjectIndexEntry[] = projects.map((p, i) => ({
  slug: p.slug,
  title: p.title,
  year: p.year,
  n: i + 1,
  color: PALETTE[i % PALETTE.length],
}));

export const projectMetaBySlug: Record<string, ProjectIndexEntry> =
  Object.fromEntries(projectIndex.map((m) => [m.slug, m]));
