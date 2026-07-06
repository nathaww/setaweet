import { cn } from "@/lib/utils";

/**
 * Shared editorial header for standalone content pages (Story, Impact Map,
 * Call for Action). Kicker + large wordmark title + optional lead, aligned to
 * the app container and offset below the fixed navbar.
 */
export function PageHeader({
  kicker,
  title,
  lead,
  className,
}: {
  kicker?: string;
  title: string;
  lead?: string;
  className?: string;
}) {
  return (
    <header className={cn("container-app pt-[calc(var(--nav-h)+3rem)] md:pt-[calc(var(--nav-h)+5rem)]", className)}>
      {kicker && <p className="slab micro text-paper/50">{kicker}</p>}
      <h1 className="wordmark mt-4 text-paper" style={{ fontSize: "var(--text-title)" }}>
        {title}
      </h1>
      {lead && <p className="mt-6 max-w-2xl text-lead text-paper/70">{lead}</p>}
    </header>
  );
}
