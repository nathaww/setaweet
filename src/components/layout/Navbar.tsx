"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Menu,
  Search,
  X,
} from "lucide-react";
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

/** Fixed top bar: Search (left) · primary links (center) · mute + menu (right).
 *  On mobile the links live in a dropdown behind the hamburger button. */
export function Navbar() {
  const { open, query, setQuery, toggle, close, sortDir, toggleSort } = useSearch();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Search only exists on the home archive; leaving home closes it.
  const isHome = pathname === "/";
  useEffect(() => {
    if (!isHome) close();
  }, [isHome, close]);

  // Navigating closes the mobile menu. Adjusting state during render (rather
  // than in an effect) applies within the same commit, avoiding a flash.
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setMenuOpen(false);
  }

  // A link is active on an exact match, or (for parents) on any nested route.
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors bg-background",
        (open || menuOpen) && "bg-ink/85 backdrop-blur-md"
      )}
    >
      <nav
        className="container-app flex items-center justify-between"
        style={{ height: "var(--nav-h)" }}
      >
        {isHome ? (
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                toggle();
              }}
              aria-expanded={open}
              aria-label="Search"
              className="flex cursor-pointer items-center gap-2 text-sm text-paper/70 transition-colors hover:text-paper"
            >
              <Search size={16} strokeWidth={1.75} />
              <span className="hidden sm:inline">Search</span>
            </button>
            <button
              type="button"
              onClick={toggleSort}
              aria-label={
                sortDir === "asc" ? "Sort by year: oldest first" : "Sort by year: newest first"
              }
              title={sortDir === "asc" ? "Oldest first" : "Newest first"}
              className="grid h-9 w-9 cursor-pointer place-items-center text-paper/70 transition-colors hover:text-paper"
            >
              {sortDir === "asc" ? (
                <ArrowUpNarrowWide size={18} strokeWidth={1.75} />
              ) : (
                <ArrowDownWideNarrow size={18} strokeWidth={1.75} />
              )}
            </button>
          </div>
        ) : (
          <span aria-hidden /> // keeps the right-side controls pinned right
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

        <div className="flex items-center gap-1">
          <MuteToggle />
          <button
            type="button"
            onClick={() => {
              close();
              setMenuOpen((o) => !o);
            }}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Menu"}
            className="-mr-2 grid h-9 w-9 cursor-pointer place-items-center text-paper/70 transition-colors hover:text-paper md:hidden"
          >
            {menuOpen ? <X size={18} strokeWidth={1.75} /> : <Menu size={18} strokeWidth={1.75} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <nav aria-label="Primary" className="container-app pb-5 md:hidden">
          <ul className="flex flex-col gap-1 border-t border-faint pt-3">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "block py-2 text-base text-paper/70 transition-colors hover:text-paper",
                    isActive(link.href) && "text-paper"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {isHome && open && (
        <div className="container-app pb-4">
          <SearchField value={query} onChange={setQuery} onClose={close} autoFocus />
        </div>
      )}
    </header>
  );
}
