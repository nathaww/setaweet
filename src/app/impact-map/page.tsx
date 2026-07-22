import type { Metadata } from "next";
import { ImpactMap } from "@/components/sections/ImpactMap";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Impact Map",
  description:
    "A map of Setaweet's reach across Ethiopia: the regions, cities, and communities touched by a decade of feminist work.",
  path: "/impact-map",
});

export default function ImpactMapPage() {
  // Full-bleed: the map fills the viewport below the fixed navbar and carries
  // its own title / index panel, so no PageHeader or container here.
  return (
    <div style={{ marginTop: "var(--nav-h)" }}>
      <ImpactMap />
    </div>
  );
}
