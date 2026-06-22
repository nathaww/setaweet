import { cn } from "@/lib/utils";

/** Setaweet mark: female (Venus) symbol + bilingual wordmark (ሰታዊት / Setaweet). */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-3 text-paper", className)}>
      <svg
        viewBox="0 0 24 34"
        aria-hidden
        className="h-8 w-auto shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
      >
        <circle cx="12" cy="10" r="8" />
        <line x1="12" y1="18" x2="12" y2="33" />
        <line x1="6" y1="26" x2="18" y2="26" />
      </svg>
      <span className="flex flex-col leading-none">
        <span lang="am" className="text-lg font-medium">
          ሰታዊት
        </span>
        <span className="text-lg font-semibold tracking-tight">Setaweet</span>
      </span>
    </span>
  );
}
