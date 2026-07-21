/**
 * Geographic pins for the Impact Map.
 *
 * Each point is a real place (by [lon, lat]) where Setaweet worked. A point can
 * carry several projects — the map card lists them, each linking to its project
 * page. Titles/years are NOT duplicated here; they are resolved from the single
 * source of truth in src/data.ts via `projectsBySlug` at render time.
 *
 * `region` matches a region slug in src/content/ethiopia-map.json so hovering /
 * selecting a pin can highlight the region it sits in.
 */
export type MapPoint = {
  id: string;
  city: string;
  /** Region slug (see ethiopia-map.json). Used to highlight the shape. */
  region: string;
  /** Longitude, latitude (WGS84). */
  lon: number;
  lat: number;
  /** Project slugs active at this location (order = display order). */
  projects: string[];
  /** True for the primary hub (Addis Ababa) so it can render larger. */
  hub?: boolean;
};

export const MAP_POINTS: MapPoint[] = [
  {
    id: "addis-ababa",
    city: "Addis Ababa",
    region: "addis-ababa",
    lon: 38.7469,
    lat: 9.0331,
    hub: true,
    projects: [
      "monthly-circles",
      "arif-abbat",
      "min-lebsa-neber",
      "gendershops",
      "writing-our-rights",
      "alegnta",
      "meqenet",
      "data-project",
      "policy-dialogues",
      "advocacy-campaign",
      "womens-national-agenda",
      "meseret",
      "transitional-justice",
    ],
  },
  {
    id: "mekelle",
    city: "Mekelle",
    region: "tigray",
    lon: 39.4753,
    lat: 13.4967,
    projects: ["arif-abbat"],
  },
  {
    id: "adigrat",
    city: "Adigrat",
    region: "tigray",
    lon: 39.4618,
    lat: 14.2769,
    projects: ["meseret", "trauma-healing"],
  },
  {
    id: "gondar",
    city: "Gondar",
    region: "amhara",
    lon: 37.4667,
    lat: 12.6,
    projects: ["min-lebsa-neber"],
  },
  {
    id: "debre-tabor",
    city: "Debre Tabor",
    region: "amhara",
    lon: 38.0167,
    lat: 11.85,
    projects: ["tesfaweet"],
  },
  {
    id: "dabat",
    city: "Dabat (Shimelaku IDP Camp)",
    region: "amhara",
    lon: 37.7644,
    lat: 12.9836,
    projects: ["humanitarian-support"],
  },
  {
    id: "debre-birhan",
    city: "Debre Birhan",
    region: "amhara",
    lon: 39.5321,
    lat: 9.6797,
    projects: ["trauma-healing"],
  },
  {
    id: "dire-dawa",
    city: "Dire Dawa",
    region: "dire-dawa",
    lon: 41.8661,
    lat: 9.5931,
    projects: ["min-lebsa-neber"],
  },
  {
    id: "bishoftu",
    city: "Bishoftu (Debrezeit)",
    region: "oromia",
    lon: 38.9833,
    lat: 8.75,
    projects: ["womens-national-agenda"],
  },
  {
    id: "hawassa",
    city: "Hawassa",
    region: "snnpr",
    lon: 38.4762,
    lat: 7.0622,
    projects: ["leddoki"],
  },
  {
    id: "wolaita",
    city: "Wolaita",
    region: "snnpr",
    lon: 37.7667,
    lat: 6.8167,
    projects: ["min-lebsa-neber"],
  },
  {
    id: "afar",
    city: "Afar",
    region: "afar",
    lon: 40.9998,
    lat: 11.7869,
    projects: ["misikir"],
  },
  {
    id: "benishangul-gumuz",
    city: "Benishangul-Gumuz",
    region: "benishangul-gumuz",
    lon: 34.5333,
    lat: 10.0667,
    projects: ["misikir"],
  },
];
