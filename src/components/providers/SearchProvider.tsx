"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

type SortDir = "asc" | "desc";

type SearchContextValue = {
  open: boolean;
  /** Raw value bound to the input (updates immediately). */
  query: string;
  /** Debounced value for consumers that filter (e.g. the home archive). */
  debouncedQuery: string;
  setQuery: (q: string) => void;
  toggle: () => void;
  close: () => void;
  /** Home-archive sort direction (by year). Shared with the Navbar control. */
  sortDir: SortDir;
  /** True once the user has toggled sort — drives the left-aligned rail. */
  sortTouched: boolean;
  toggleSort: () => void;
};

const SearchContext = createContext<SearchContextValue | null>(null);
const DEBOUNCE_MS = 200;

/** Holds the (nav-driven) search state shared between the Navbar and the home. */
export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [sortTouched, setSortTouched] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Debounce the query so filtering / transitions don't run on every keystroke.
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timer.current);
  }, [query]);

  const value = useMemo<SearchContextValue>(
    () => ({
      open,
      query,
      debouncedQuery,
      setQuery,
      toggle: () => setOpen((o) => !o),
      // Closing clears the query immediately so the archive returns to full view.
      close: () => {
        setOpen(false);
        setQuery("");
        setDebouncedQuery("");
      },
      sortDir,
      sortTouched,
      toggleSort: () => {
        setSortTouched(true);
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      },
    }),
    [open, query, debouncedQuery, sortDir, sortTouched]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within <SearchProvider>");
  return ctx;
}
