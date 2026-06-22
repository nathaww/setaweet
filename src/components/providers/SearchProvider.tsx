"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

type SearchContextValue = {
  open: boolean;
  /** Raw value bound to the input (updates immediately). */
  query: string;
  /** Debounced value for consumers that filter (e.g. the home archive). */
  debouncedQuery: string;
  setQuery: (q: string) => void;
  toggle: () => void;
  close: () => void;
};

const SearchContext = createContext<SearchContextValue | null>(null);
const DEBOUNCE_MS = 200;

/** Holds the (nav-driven) search state shared between the Navbar and the home. */
export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
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
    }),
    [open, query, debouncedQuery]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within <SearchProvider>");
  return ctx;
}
