import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

const FOOTER_LINKS = [
  { label: "The setaweet story", href: "/story" },
  { label: "Impact Map", href: "/impact-map" },
  { label: "Call for Action", href: "/call-for-action" },
];

/** Deep-teal footer with the bilingual mark and primary links. */
export function Footer() {
  return (
    <footer className="bg-teal text-paper">
      <div className="container-app flex flex-col gap-8 py-12 md:flex-row md:items-center md:justify-between md:py-16">
        <Logo />
        <nav>
          <ul className="flex flex-col gap-1.5 text-sm text-paper/90 md:items-end">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-opacity hover:opacity-70">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
