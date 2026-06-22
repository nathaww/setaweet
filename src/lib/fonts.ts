import { Archivo, Roboto_Slab, Noto_Sans_Ethiopic } from "next/font/google";

/**
 * Setaweet Archive font system. Each font exposes a CSS variable consumed by
 * the Tailwind `@theme` tokens in globals.css. Add `fontVariables` to <html>.
 *
 * - Archivo .............. wide grotesque — wordmark, titles, UI/body
 * - Roboto Slab ......... slab serif — year numerals + "Preserving…" tagline
 * - Noto Sans Ethiopic .. Amharic (ሰታዊት) — logo + Amharic accents
 */

export const sans = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

export const slab = Roboto_Slab({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-slab",
  weight: ["400", "500", "700"],
});

export const amharic = Noto_Sans_Ethiopic({
  subsets: ["ethiopic"],
  display: "swap",
  variable: "--font-amharic",
  weight: ["400", "500", "700"],
});

/** Space-separated variable classes for the <html> element. */
export const fontVariables = [sans.variable, slab.variable, amharic.variable].join(" ");
