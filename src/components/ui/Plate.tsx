import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";
import type { ArchiveImage } from "@/data";
import { cn } from "@/lib/utils";

type PlateProps = {
  image: ArchiveImage;
  /** Responsive sizes hint for next/image. */
  sizes?: string;
  priority?: boolean;
  /** Eager-load without preloading — for above-the-fold images near the LCP. */
  eager?: boolean;
  /** Varies the placeholder tone so adjacent frames stay distinguishable. */
  tone?: number;
  className?: string;
};

/**
 * An archive image frame backed by next/image (automatic resizing / AVIF).
 * Renders the real photo when `image.src` is set, otherwise a tonal
 * placeholder labelled with the alt text. Fills its (sized) parent.
 */
export function Plate({
  image,
  sizes = "(max-width: 768px) 70vw, 30vw",
  priority = false,
  eager = false,
  tone = 0,
  className,
}: PlateProps) {
  if (image.src) {
    return (
      <span className={cn("relative block h-full w-full", className)}>
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : eager ? "eager" : undefined}
          draggable={false}
          className="object-cover"
        />
      </span>
    );
  }

  const l = 16 + (Math.abs(tone) % 4) * 4; // 16–28% lightness
  return (
    <span
      aria-label={image.alt}
      className={cn("grid h-full w-full place-items-center", className)}
      style={{
        background: `linear-gradient(145deg, hsl(165 7% ${l + 7}%), hsl(165 9% ${l - 5}%))`,
      }}
    >
      <span className="flex flex-col items-center gap-2 px-4 text-center text-paper/45">
        <ImageIcon size={22} strokeWidth={1.5} className="opacity-50" />
        <span className="micro">{image.alt}</span>
      </span>
    </span>
  );
}
