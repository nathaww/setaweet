import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontVariables } from "@/lib/fonts";
import { buildMetadata, organizationSchema, siteConfig } from "@/lib/seo";
import { Navbar } from "@/components/layout/Navbar";
import { ConditionalFooter } from "@/components/layout/ConditionalFooter";
import { ScrollProgressProvider } from "@/components/layout/ScrollProgress";
import { Preloader } from "@/components/sections/Preloader";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { SearchProvider } from "@/components/providers/SearchProvider";
import { PageTransition } from "@/components/providers/PageTransition";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  ...buildMetadata(),
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.legalName }],
  creator: siteConfig.legalName,
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0b0b0b" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-ink text-paper">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema()) }}
        />
        <Preloader />
        <SearchProvider>
          <SmoothScroll>
            <PageTransition>
              <Navbar />
              <ScrollProgressProvider>
                <main className="flex-1">{children}</main>
              </ScrollProgressProvider>
              <ConditionalFooter />
            </PageTransition>
          </SmoothScroll>
        </SearchProvider>
      </body>
    </html>
  );
}
