import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Call for Action",
  description:
    "A farewell message from the Setaweet Movement as we close our Ethiopia office in 2026 and reorient our feminist work.",
  path: "/call-for-action",
});

/** Body paragraphs of the farewell message (in order). */
const PARAGRAPHS = [
  "We acknowledge that Setaweet Movement pivots in strategy and scope at a time when civil liberties and the pursuit of human rights are increasingly under threat. With a few actors left working in the civil rights space, and with many independent journalists and human rights activists exiled or imprisoned, our team evicts the space with sadness but with a profound hope that our new and existing partners will take on the mantle of defending the human rights of Ethiopian women. At the same time, we commit to amplifying the fight for Ethiopian women’s human rights in alternative spaces and through new avenues.",
  "As the outcome of the seventh general election is announced in July, and as we expect the Prosperity party to usher in a new Parliament in October, we urge the government to review its record and stance on human rights, and particularly on gendered violence during periods of armed conflict, as well as during periods of peace. We hope that the government renews the commitments made during the political reform days to deliver on an Ethiopia where human rights and civil and press freedoms are respected. In particular, and based on our work in Internally Displaced People’s camps in the last three years, we call upon the government and its development partners to review existing policies to internal displacement so that the rights of displaced citizens are protected, and durable solutions are reached in the crises of conflict and natural disasters that have displaced millions of displaced women, men, and children throughout the country.",
  "The new government will form on the heels of the long-awaited National Dialogue Process. It is our deep hope that, beyond legitimizing the government’s existing priorities, the outcomes of the process will lead to genuine breakthroughs in the gridlock that has fractured Ethiopia.",
  "In the same vein, the Transitional Justice that the government will embark on in the next year should deliver real justice for the tens of thousands of Ethiopian women and men who have been victimized by conflict in the last three decades, and avoid a performative platform that may cause further harm to survivors.",
  "As we take the scope of the last twelve years of feminist work and as we prepare to reorient our work, the Setaweet Team, together with its Board of Directors and friends and volunteers, wishes all women and men in Ethiopia a renewed engagement with human rights and the pursuit of human dignity.",
];

export default function CallForActionPage() {
  return (
    <div className="min-h-svh pb-28 md:pb-40">
      <div className="container-app pt-[calc(var(--nav-h)+3rem)] md:pt-[calc(var(--nav-h)+5rem)]">
        <article className="mx-auto max-w-3xl">
          <p className="slab micro text-paper/50">July 2026</p>
          <h1
            className="wordmark mt-4 text-paper"
            style={{ fontSize: "var(--text-title)" }}
          >
            A Farewell Message
          </h1>

          <div className="mt-10 space-y-6 text-lead leading-relaxed text-paper/85 md:mt-14">
            <p>
              As Setaweet Movement closes the doors of our Ethiopia office in 2026,{" "}
              {/* TODO(content): replace this editorial placeholder with the final opening
                  drawn from the notes, folding in the pivot to working in conflict areas. */}
              <span className="rounded bg-teal-deep/40 px-1 italic text-paper/55">
                [from Notes on laptop, and add our pivot to working in conflict areas]
              </span>
              .
            </p>
            {PARAGRAPHS.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
