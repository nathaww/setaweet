"use client";

import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

/** Ambient-sound mute toggle (top-right of the nav). Visual-only by default. */
export function MuteToggle({ className }: { className?: string }) {
  const [muted, setMuted] = useState(true);

  return (
    <button
      type="button"
      aria-label={muted ? "Unmute ambient sound" : "Mute ambient sound"}
      aria-pressed={muted}
      onClick={() => setMuted((m) => !m)}
      className={cn(
        "grid h-9 w-9 place-items-center text-paper/80 transition-colors hover:text-paper",
        className
      )}
    >
      {muted ? <VolumeX size={20} strokeWidth={1.75} /> : <Volume2 size={20} strokeWidth={1.75} />}
    </button>
  );
}
