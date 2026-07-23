/**
 * Geographic pins for the Impact Map.
 *
 * Source of truth: "Impact Map Locations.docx". Each point is a real place
 * (by [lon, lat]) where Setaweet worked; a point can carry several projects and
 * a project can appear at several points. Titles/years are NOT duplicated here
 * — they resolve from src/data.ts at render time.
 *
 * Projects listed in the document with an unknown location ("?") deliberately
 * have no pin, and show as dimmed entries in the index:
 *   - Transitional Justice
 *   - Trauma Healing Work
 *   - Advocacy Campaign > Lek Adelem
 *   - Women's National Agenda > National Women's Conference
 *
 * `region` matches a region slug in src/content/ethiopia-map.json.
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
      "monthly-circles", // Monthly Circles & Quarterly Open Sessions
      "arif-abbat", // 1st Exhibition
      "min-lebsa-neber",
      "gendershops", // Addis Ababa and across Ethiopia
      "alegnta", // nationwide, run from Addis
      "writing-our-rights",
      "meqenet",
      "data-project",
      "policy-dialogues",
      "meseret",
      "advocacy-campaign", // Unveiling Stories
    ],
  },
  {
    id: "mekelle",
    city: "Mekelle",
    region: "tigray",
    lon: 39.4753,
    lat: 13.4967,
    projects: ["arif-abbat", "misikir"], // 2nd Exhibition; Misikir in Tigray
  },
  {
    id: "adigrat",
    city: "Adigrat",
    region: "tigray",
    lon: 39.4618,
    lat: 14.2769,
    projects: ["meseret"],
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
    projects: ["tesfaweet"], // Debre Tabor, Farta, South Gondar
  },
  {
    id: "bahir-dar",
    city: "Amhara",
    region: "amhara",
    lon: 37.3908,
    lat: 11.5936,
    projects: ["misikir", "negari"],
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
    projects: ["womens-national-agenda"], // National Women's Forum
  },
  {
    id: "hawassa",
    city: "Hawassa",
    region: "snnpr",
    lon: 38.4762,
    lat: 7.0622,
    projects: ["leddoki"], // Hawassa, Sidama
  },
  {
    id: "wolayita",
    city: "Wolayita",
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
    projects: ["misikir", "negari"],
  },
  {
    id: "somali",
    city: "Somali",
    region: "somali",
    lon: 42.8,
    lat: 9.35,
    projects: ["negari"],
  },
];
