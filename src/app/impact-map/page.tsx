import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { ScaffoldNotice } from "@/components/layout/ScaffoldNotice";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Impact Map",
  description:
    "A map of Setaweet's reach across Ethiopia — the regions, cities, and communities touched by a decade of feminist work.",
  path: "/impact-map",
});

export default function ImpactMapPage() {
  return (
    <div className="min-h-svh pb-28 md:pb-40">
      <PageHeader
        kicker="Reach"
        title="Impact Map"
        lead="The regions, cities, and communities across Ethiopia touched by a decade of feminist work."
      />
      <ScaffoldNotice>
        The interactive impact map is being prepared for this page. Let us know the
        locations and figures to plot and we&rsquo;ll build it out here.
      </ScaffoldNotice>
    </div>
  );
}
