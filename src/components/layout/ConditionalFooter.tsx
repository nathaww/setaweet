"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/Footer";

/** The project reader is a full-screen looped experience — no footer there. */
export function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/projects")) return null;
  return <Footer />;
}
