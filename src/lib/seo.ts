import type { Metadata } from "next";

/** Single source of truth for brand + SEO metadata. */
export const siteConfig = {
  name: "Setaweet",
  legalName: "The Setaweet Movement",
  // Override in production via NEXT_PUBLIC_SITE_URL.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://setaweet.com",
  description:
    "The Setaweet Archive preserves the collective memory of Ethiopia's feminist movement: a decade of circles, campaigns, and conversations since 2014.",
  tagline: "Preserving Collective Memory.",
  locale: "en_US",
  twitter: "@setaweet",
  keywords: [
    "Setaweet",
    "Setaweet Archive",
    "Ethiopian feminism",
    "feminist movement",
    "gender justice",
    "collective memory",
  ],
  contact: {
    locality: "Addis Ababa",
    country: "Ethiopia",
  },
  social: {} as Record<string, string>,
} as const;

type BuildMetadataArgs = {
  title?: string;
  description?: string;
  path?: string;
};

/** Compose page-level metadata from the shared site config. */
export function buildMetadata({
  title,
  description = siteConfig.description,
  path = "/",
}: BuildMetadataArgs = {}): Metadata {
  const url = new URL(path, siteConfig.url).toString();
  const fullTitle = title ? `${title} · ${siteConfig.name}` : siteConfig.name;

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: siteConfig.legalName,
      title: fullTitle,
      description,
      url,
      locale: siteConfig.locale,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      site: siteConfig.twitter,
      creator: siteConfig.twitter,
    },
  };
}

/** Organization JSON-LD for rich results. */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.legalName,
    alternateName: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    sameAs: Object.values(siteConfig.social),
  };
}
