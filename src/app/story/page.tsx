import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "The Setaweet Story",
  description:
    "The story of the Setaweet Movement — a decade of feminist organizing in Ethiopia: the movement, its milestones, and its presence in the media.",
  path: "/story",
});

/** The three sections that live within this page. */
const SECTIONS = [
  {
    id: "movement",
    title: "The Setaweet Movement",
    lead: "Ethiopia's contemporary feminist collective, founded in July 2014.",
  },
  {
    id: "milestone",
    title: "Setaweet Milestone",
    lead: "The moments that marked a decade of circles, campaigns, and collective memory.",
  },
  {
    id: "media",
    title: "Setaweet in Media",
    lead: "Setaweet across film, radio, television, and the press.",
  },
];

export default function StoryPage() {
  return (
    <div className="min-h-svh pb-28 md:pb-40">
      <PageHeader
        kicker="2014 — 2026"
        title="The Setaweet Story"
        lead="A decade of feminist organizing in Ethiopia — told through the movement, its milestones, and its presence in the media."
      />

      {/* In-page section index — jumps to the sections below. */}
      <nav aria-label="Sections" className="container-app mt-10">
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-paper/50">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="transition-colors hover:text-paper">
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="container-app mt-16 flex flex-col gap-16 md:mt-24 md:gap-24">
        {SECTIONS.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="scroll-mt-[calc(var(--nav-h)+2rem)] border-t border-faint pt-10 md:pt-14"
          >
            <h2
              className="wordmark text-paper"
              style={{ fontSize: "clamp(1.75rem, 1rem + 3vw, 3.25rem)" }}
            >
              {section.title}
            </h2>
            <p className="mt-4 max-w-2xl text-lead text-paper/70">{section.lead}</p>

            <div className="mt-8 max-w-2xl rounded-lg border border-dashed border-faint bg-coal/40 p-6 md:p-8">
              <p className="slab micro text-teal">In preparation</p>
              <p className="mt-3 text-base text-paper/70">
                Content for this section is being prepared. Share the copy and we&rsquo;ll set
                it here.
              </p>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
