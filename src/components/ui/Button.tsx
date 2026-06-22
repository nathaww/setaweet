"use client";

import Link from "next/link";
import { useMagnetic } from "@/hooks/useMagnetic";
import { cn } from "@/lib/utils";

type Variant = "solid" | "outline" | "ghost";

const variants: Record<Variant, string> = {
  solid: "bg-paper text-ink hover:bg-paper/90",
  outline: "border border-paper/40 text-paper hover:border-paper hover:bg-paper/5",
  ghost: "text-paper/80 hover:text-paper",
};

type BaseProps = {
  variant?: Variant;
  /** Magnetic cursor-follow on hover (fine pointers only). */
  magnetic?: boolean;
  className?: string;
  children: React.ReactNode;
};

type ButtonAsButton = BaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & { href?: undefined };
type ButtonAsLink = BaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps> & { href: string };

/** Pill button. Renders <Link> when `href` is set, otherwise <button>. */
export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "solid", magnetic = false, className, children, ...rest } = props;
  const ref = useMagnetic<HTMLAnchorElement & HTMLButtonElement>(magnetic ? 0.35 : 0);

  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-medium",
    "transition-colors duration-300 ease-[var(--ease-out-expo)] will-change-transform",
    variants[variant],
    className
  );

  if ("href" in props && props.href !== undefined) {
    const { href, ...anchorRest } = rest as React.AnchorHTMLAttributes<HTMLAnchorElement> & {
      href: string;
    };
    return (
      <Link ref={magnetic ? ref : undefined} href={href} className={classes} {...anchorRest}>
        {children}
      </Link>
    );
  }

  return (
    <button
      ref={magnetic ? ref : undefined}
      className={classes}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}
