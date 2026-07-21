import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { ImpactMap } from "@/components/sections/ImpactMap";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Impact Map",
  description:
    "A map of Setaweet's reach across Ethiopia: the regions, cities, and communities touched by a decade of feminist work.",
  path: "/impact-map",
});

export default function ImpactMapPage() {
  return (
    <div className="min-h-svh pb-28 md:pb-40">
      <PageHeader
        kicker="Reach"
        title="Impact Map"
        lead="The regions, cities, and communities across Ethiopia touched by a decade of feminist work. Zoom in and tap a pin to explore the projects rooted there."
      />
      <ImpactMap />
    </div>
  );
}
