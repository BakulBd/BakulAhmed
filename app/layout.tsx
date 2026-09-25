import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import CodeCopy from "@/components/code-copy";
import Constellation from "@/components/constellation";
import IdentityRail from "@/components/identity-rail";
import MoodProvider from "@/components/mood-provider";
import MoodSwitch from "@/components/mood-switch";
import PanelNav from "@/components/panel-nav";
import RouteTransition from "@/components/route-transition";
import Scene from "@/components/scene";
import ScrollReveal from "@/components/scroll-reveal";
import SiteFooter from "@/components/site-footer";
import Spotlight from "@/components/spotlight";
import { site } from "@/lib/content";
import { moodScript } from "@/lib/mood";
import { feedLink, JsonLd, personNode, websiteNode } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.title}`, template: `%s — ${site.name}` },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  keywords: [
    site.name,
    "Bakul Ahmed portfolio",
    "Computer Science Engineer",
    "Full-stack developer Bangladesh",
    "AI ML developer Dhaka",
    "Next.js developer",
    "Three.js",
    "Green University of Bangladesh",
    "Green University Computer Club",
    "GUCC General Secretary",
  ],
  category: "technology",
  alternates: {
    canonical: "/",
    types: feedLink,
  },
  // Set these in the host's environment once Search Console / Bing Webmaster
  // hand you a token; nothing is emitted while they are unset.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
  // Phone numbers and addresses shouldn't be auto-linked over the design.
  formatDetection: { telephone: false, address: false, email: false },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    title: `${site.name} — ${site.title}`,
    description: site.description,
    locale: site.locale,
  },
  twitter: { card: "summary_large_image", title: `${site.name} — ${site.title}`, description: site.description },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
};

export const viewport: Viewport = {
  // Every mood is dark, so one value; MoodProvider keeps it in step with the
  // current sky so the browser chrome matches the page.
  themeColor: "#030810",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  // Required for env(safe-area-inset-*) to report anything on notched phones.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: moodScript }} />
      </head>
      <body>
        <MoodProvider>
          <Scene />
          <Constellation />

          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-accent focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-accent-contrast"
          >
            Skip to content
          </a>


          <div className="shell relative z-10 pt-5 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pt-6 md:pb-10">
            <div className="mb-4 flex items-center justify-between gap-4 md:mb-6">
              <a
                href="/"
                className="inline-flex min-h-[1.75rem] items-center text-[0.95rem] font-semibold tracking-[-0.02em] text-fg transition-opacity duration-300 hover:opacity-70"
              >
Bakul{" "}
                <span className="text-accent">Ahmed.</span>
              </a>
              <MoodSwitch />
            </div>

            <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
              <IdentityRail />

              <div className="panel shine shine--panel relative min-w-0">
                <PanelNav />
                <main id="main" className="px-5 pb-8 pt-7 sm:px-7 md:px-9 md:pb-11 md:pt-20">
                  <RouteTransition>{children}</RouteTransition>
                </main>
              </div>
            </div>

            <SiteFooter />
          </div>

          <ScrollReveal />
          <Spotlight />
          <CodeCopy />
          {/* The person and the site, on every page. Pages add their own nodes
              (ProfilePage on the home route, BlogPosting on a post). */}
          <JsonLd graph={[personNode, websiteNode]} />
        </MoodProvider>
      </body>
    </html>
  );
}
