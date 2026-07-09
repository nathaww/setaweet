import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MilestoneMarquee, type MarqueeImage } from "@/components/sections/MilestoneMarquee";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "The Setaweet Story",
  description:
    "The story of the Setaweet Movement, a decade of feminist organizing in Ethiopia: the movement, its milestones, and its presence in the media.",
  path: "/story",
});

/** The three sections that live within this page. */
const SECTIONS = [
  { id: "movement", title: "About Setaweet Movement" },
  { id: "milestone", title: "Setaweet Milestone" },
  { id: "media", title: "Setaweet in Media" },
];

type MediaItem = {
  title: string;
  source?: string;
  date: string;
  href: string;
};

const ARTICLES: MediaItem[] = [
  {
    title: "A profile on the work of Setaweet Movement in gendered violence in Ethiopia",
    source: "Pulitzer Center",
    date: "January 2022",
    href: "https://pulitzercenter.org/stories/ethiopian-feminists-mission-help-sexual-assault-survivors",
  },
  {
    title: "An introduction to Setaweet Movement",
    source: "Tadias Magazine",
    date: "July 2018",
    href: "http://www.tadias.com/07/24/2018/setaweet-ethiopias-capital-city-is-home-to-a-burgeoning-womens-movement/",
  },
  {
    title: "An introduction to Setaweet Movement, posted by Setaweet partners",
    source: "Womankind Worldwide",
    date: "August 2016",
    href: "https://www.womankind.org.uk/i-thought-i-was-the-only-one-growing-a-feminist-movement-in-ethiopia/",
  },
];

const INTERVIEWS: MediaItem[] = [
  {
    title: "Interview with Sehin Teferra on gendered violence in Ethiopia",
    source: "Sheger Radio",
    date: "August 2024",
    href: "https://www.youtube.com/watch?v=FGJNz8MoIXE&t=12s",
  },
  {
    title:
      "Interview with Sehin Teferra on gendered violence, focusing on the rape and murder of seven-year-old Heaven Awot",
    source: "Mengizem Media",
    date: "August 2024",
    href: "https://www.youtube.com/watch?v=EAPlAtviR28",
  },
  {
    title: "An International Women's Day celebration",
    source: "Womankind Worldwide",
    date: "March 2024",
    href: "https://www.youtube.com/watch?v=fAyyxIAb9Hg&t=65s",
  },
  {
    title:
      "Interview with Sehin Teferra on human rights groups' visit to Mekelle, Tigrai following the Pretoria Accords to end the war in Northern Ethiopia",
    source: "Mengizem Media",
    date: "February 2023",
    href: "https://www.youtube.com/watch?v=r5c7uLHRVY8",
  },
  {
    title:
      "An interview with Sehin Teferra on structure changes and policy for women's participation",
    date: "March 2022",
    href: "https://www.youtube.com/watch?v=h4rwHuWHyyI",
  },
  {
    title: "Hear Her Voice: a partner profile of Setaweet Movement",
    source: "Womankind Worldwide",
    date: "March 2021",
    href: "https://www.youtube.com/watch?v=A_Ih96NTiAU",
  },
  {
    title: "Interview with Sehin Teferra, an introduction to Setaweet Movement",
    source: "Meet ETV",
    date: "July 2019",
    href: "https://youtu.be/dkof3KqJqL4",
  },
  {
    title: "Setaweet members' interview on feminism",
    source: "Kana Television",
    date: "June 2019",
    href: "https://www.youtube.com/watch?v=SdKr39QiIdI",
  },
];

/** 10th anniversary celebration photos (June 22, 2024). Invitation card first. */
const MILESTONE_IMAGES: MarqueeImage[] = [
  {
    src: "/story/milestone/01.jpeg",
    alt: "Invitation to Setaweet's 10th anniversary celebration, June 22, 2024",
    width: 421,
    height: 595,
  },
  ...[
    { n: "02.jpg", w: 1080, h: 810 },
    { n: "03.jpg", w: 1080, h: 810 },
    { n: "04.jpeg", w: 853, h: 1280 },
    { n: "05.jpeg", w: 853, h: 1280 },
    { n: "06.jpeg", w: 853, h: 1280 },
    { n: "07.jpeg", w: 1280, h: 853 },
    { n: "08.jpeg", w: 1280, h: 853 },
    { n: "09.jpeg", w: 1280, h: 853 },
    { n: "10.jpeg", w: 853, h: 1280 },
    { n: "11.jpeg", w: 1280, h: 853 },
    { n: "12.jpeg", w: 1280, h: 853 },
    { n: "13.jpeg", w: 1280, h: 853 },
    { n: "14.jpeg", w: 1280, h: 853 },
  ].map(({ n, w, h }, i) => ({
    src: `/story/milestone/${n}`,
    alt: `Guests at Setaweet's 10th anniversary celebration, photo ${i + 1}`,
    width: w,
    height: h,
  })),
];

const sectionClass = "scroll-mt-[calc(var(--nav-h)+2rem)] border-t border-faint pt-10 md:pt-14";
const headingStyle = { fontSize: "clamp(1.75rem, 1rem + 3vw, 3.25rem)" };

const linkClass =
  "text-paper underline decoration-paper/30 underline-offset-4 transition-colors hover:decoration-paper";

function MediaList({ label, items }: { label: string; items: MediaItem[] }) {
  return (
    <div>
      <h3 className="slab micro text-paper/50">{label}</h3>
      <ul className="mt-2 divide-y divide-faint">
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-1.5 py-5 sm:flex-row sm:items-baseline sm:gap-8"
            >
              <span className="slab micro shrink-0 text-paper/45 sm:w-32">{item.date}</span>
              <span className="flex-1 text-base leading-relaxed text-paper/80 transition-colors group-hover:text-paper">
                {item.title}
                {/* Non-breaking space keeps the arrow glued to the last word. */}
                <span className="whitespace-nowrap">
                  &nbsp;
                  <ArrowUpRight
                    size={14}
                    className="inline -translate-y-px text-paper/40 transition group-hover:translate-x-0.5 group-hover:text-paper"
                  />
                </span>
              </span>
              {item.source && (
                <span className="micro shrink-0 text-paper/45 sm:text-right">{item.source}</span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function StoryPage() {
  return (
    <div className="min-h-svh pb-28 md:pb-40">
      <PageHeader
        kicker="2014 to 2026"
        title="The Setaweet Story"
        lead="A decade of feminist organizing in Ethiopia, told through the movement, its milestones, and its presence in the media."
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
        {/* About Setaweet Movement */}
        <section id="movement" className={sectionClass}>
          <p className="slab micro text-paper/50">June 2026</p>
          <h2 className="wordmark mt-4 text-paper" style={headingStyle}>
            About Setaweet Movement
          </h2>

          <div className="mt-8 flex max-w-2xl flex-col gap-6">
            <p className="text-lead leading-relaxed text-paper/80">
              Founded in 2014, Setaweet Movement has been a leader in the Ethiopian feminist
              movement space for the past twelve years, with strategic investment in building a
              mass-based movement that articulates Ethiopian feminisms. Setaweet problematizes
              deep-rooted cultures of gender-based violence through advocacy products such as
              the{" "}
              <Link href="/projects/min-lebsa-neber" className={linkClass}>
                What She Wore
              </Link>{" "}
              campaign on victim-blaming, and services such as the{" "}
              <Link href="/projects/alegnta" className={linkClass}>
                Alegnta hotline
              </Link>{" "}
              for sexual violence survivors.
            </p>
            <p className="text-base leading-relaxed text-paper/70">
              Responding to the rise in conflicts in many parts of the country, and with a strong
              commitment to eventual justice and accountability, the Setaweet team has documented,
              since 2022, the gendered impact of armed conflict, while providing trauma-healing
              services in conflict settings in Tigrai and Amhara regions.
            </p>
            <p className="text-base leading-relaxed text-paper/70">
              As the Ethiopian office of Setaweet Movement closes in July 2026, the feminist
              advocacy and gender justice work of the organization will pivot to a more conducive
              setting for human rights work.{" "}
              <span className="text-paper">
                The Setaweet Movement Story will continue, and our commitment to gender justice in
                Ethiopia remains unwavering.
              </span>
            </p>
          </div>
        </section>

        {/* Setaweet Milestone */}
        <section id="milestone" className={sectionClass}>
          <p className="slab micro text-paper/50">June 2024</p>
          <h2 className="wordmark mt-4 text-paper" style={headingStyle}>
            Setaweet Milestone
          </h2>

          <div className="mt-8 flex max-w-2xl flex-col gap-6">
            <p className="text-lead leading-relaxed text-paper/80">
              In 2024 Setaweet marked its 10th anniversary, a decade since the movement&rsquo;s
              inception in July 2014. The celebration at the Setaweet office brought together the
              community, partners, and allies who have shaped ten years of feminist organizing in
              Ethiopia.
            </p>
            <p className="text-base leading-relaxed text-paper/70">
              The gathering honored the circles, campaigns, and conversations that grew from a
              single monthly meeting into a nationwide movement for gender equality and collective
              memory, traced across the milestone wall of projects photographed here.
            </p>
          </div>

          <div className="mt-10 md:mt-14">
            <MilestoneMarquee images={MILESTONE_IMAGES} />
          </div>
        </section>

        {/* Setaweet in Media */}
        <section id="media" className={sectionClass}>
          <h2 className="wordmark text-paper" style={headingStyle}>
            Setaweet in Media
          </h2>
          <p className="mt-4 max-w-2xl text-lead text-paper/70">
            Setaweet across the press, radio, and television.
          </p>

          <div className="mt-10 flex max-w-4xl flex-col gap-12">
            <MediaList label="Articles" items={ARTICLES} />
            <MediaList label="Interview Videos" items={INTERVIEWS} />
          </div>
        </section>
      </div>
    </div>
  );
}
