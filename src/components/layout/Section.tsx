import { cn } from "@/lib/utils";

type SectionProps = {
  id?: string;
  className?: string;
  /** Vertical rhythm. */
  spacing?: "none" | "sm" | "md" | "lg";
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>;

const spacingMap = {
  none: "",
  sm: "py-12 md:py-16",
  md: "py-20 md:py-28",
  lg: "py-28 md:py-40",
} as const;

/** Semantic <section> with consistent vertical rhythm. */
export function Section({ id, className, spacing = "md", children, ...props }: SectionProps) {
  return (
    <section id={id} className={cn(spacingMap[spacing], className)} {...props}>
      {children}
    </section>
  );
}
