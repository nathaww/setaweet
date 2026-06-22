"use client";

import { memo } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onClose?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
};

/** Minimal underlined search input with a clear/close button. */
export const SearchField = memo(function SearchField({
  value,
  onChange,
  onClose,
  placeholder = "Search the archive",
  autoFocus = false,
  className,
}: SearchFieldProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 border-b border-paper/20 pb-2 transition-colors focus-within:border-paper/60",
        className
      )}
    >
      <Search size={18} strokeWidth={1.75} className="shrink-0 text-paper/50" />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && onClose?.()}
        placeholder={placeholder}
        aria-label="Search the archive"
        className="w-full bg-transparent text-base text-paper placeholder:text-paper/40 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
      />
      {onClose && (
        <button
          type="button"
          aria-label="Close search"
          onClick={onClose}
          className="grid h-6 w-6 cursor-pointer place-items-center rounded-full text-paper/50 transition-colors hover:text-paper"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
});
