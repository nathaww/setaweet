"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { MuteToggle } from "@/components/ui/MuteToggle";
import { SearchField } from "@/components/ui/SearchField";
import { useSearch } from "@/components/providers/SearchProvider";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "The Setaweet Story", href: "/story" },
  { label: "Impact Map", href: "/impact-map" },
  { label: "Call for Action", href: "/call-for-action" },
];

/** Fixed top bar: Search (left) · primary links (center) · mute (right). */
export function Navbar() {
  const { open, query, setQuery, toggle, close } = useSearch();
  const pathname = usePathname();

  // Search only exists on the home archive; leaving home closes it.
  const isHome = pathname === "/";
  useEffect(() => {
    if (!isHome) close();
  }, [isHome, close]);

  // A link is active on an exact match, or (for parents) on any nested route.
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors bg-background",
        open && "bg-ink/85 backdrop-blur-md"
      )}
    >
      <nav
        className="container-app flex items-center justify-between"
        style={{ height: "var(--nav-h)" }}
      >
        {isHome ? (
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-label="Search"
            className="flex cursor-pointer items-center gap-2 text-sm text-paper/70 transition-colors hover:text-paper"
          >
            <Search size={16} strokeWidth={1.75} />
            <span className="hidden sm:inline">Search</span>
          </button>
        ) : (
          <span aria-hidden /> // keeps the mute toggle pinned right
        )}

        {!open && (
          <ul className="pointer-events-auto absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 text-sm text-paper/60 md:flex">
            {NAV_LINKS.map((link, i) => (
              <li key={link.href} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden className="text-paper/25">/</span>}
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "whitespace-nowrap transition-colors hover:text-paper",
                    isActive(link.href) && "text-paper"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <MuteToggle className="-mr-2" />
      </nav>

      {isHome && open && (
        <div className="container-app pb-4">
          <SearchField value={query} onChange={setQuery} onClose={close} autoFocus />
        </div>
      )}
    </header>
  );
}
