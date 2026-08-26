import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import "../globals.css";

// Import Vercel packages dynamically to avoid build errors
import dynamic from "next/dynamic";
const Analytics = dynamic(() =>
  import("@vercel/analytics/react").then((mod) => mod.Analytics),
);
const SpeedInsights = dynamic(() =>
  import("@vercel/speed-insights/next").then((mod) => mod.SpeedInsights),
);
import { GoogleAnalytics } from "@next/third-parties/google";
import SoundStopNavigator from "@/components/common/SoundStopNavigator";
import ChangelogBanner from "@/components/ui/ChangelogBanner";
import { ADSENSE_SCRIPT_URL } from "@/lib/adsense";
import { routing, type Locale } from "@/i18n/routing";
import { getSansFontClass, geistMono } from "@/lib/fonts";
import { buildAlternates } from "@/lib/seo/alternates";

// Define your site URL for canonical and OG URLs
const siteUrl = "https://thememorychess.com";

// Social preview artwork. Served as a static file from /public rather than a
// dynamic `opengraph-image` route: X's card crawler is noticeably more reliable
// against a plain PNG with no query string and no Next.js `Vary` headers.
const socialImage = {
  url: `${siteUrl}/social-preview.png`,
  width: 1200,
  height: 630,
  type: "image/png",
  alt: "Memory Chess knight and brain logo — thememorychess.com",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    // Basic Metadata
    title: {
      default: "Memory Chess: Free Chess Memory and Visualization Game",
      template: "%s | Memory Chess",
    },
    description:
      "Memorize a chess position, rebuild it from memory, and get an instant score. Play free to train board vision, visualization, and spatial memory.",

    // Canonical + hreflang for the home route; child routes override via route metadata
    alternates: buildAlternates("/", locale),

    // Icons
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-touch-icon.png",
      shortcut: "/favicon-16x16.png",
    },

    // Open Graph (Facebook, LinkedIn) metadata
    openGraph: {
      type: "website",
      url: siteUrl,
      title: "Memory Chess: Free Chess Memory and Visualization Game",
      description:
        "Memorize a chess position, rebuild it, and get an instant score. Play free with no account needed.",
      siteName: "Memory Chess",
      images: [socialImage],
    },

    // Twitter metadata
    twitter: {
      card: "summary_large_image",
      title: "Memory Chess: Free Chess Memory Game",
      description:
        "Memorize a chess position, rebuild it, and improve your board vision one round at a time.",
      // Must match the Open Graph URL exactly. X caches cards against the *page*
      // URL, not the image URL, so a query-string bump here does nothing -- share
      // a fresh URL variant (e.g. ?s=x) to force a re-crawl after artwork changes.
      images: [socialImage],
      creator: "@TheMemoryChess",
      site: "@TheMemoryChess",
    },

    // Robots - default Next.js sets index, follow
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    // Verification for search consoles (add yours when available)
    verification: {
      // google: 'your-google-site-verification',
      // bing: 'your-bing-verification',
    },

    // App information for progressive web app
    applicationName: "Memory Chess",
    appleWebApp: {
      title: "Memory Chess",
      statusBarStyle: "black-translucent",
      capable: true,
    },

    // Content type
    metadataBase: new URL(siteUrl),
    creator: "Memory Chess Team",
    publisher: "Memory Chess",
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1D1C20",
  colorScheme: "dark",
};

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Required for the locale segment to stay statically rendered, which the
  // whole SEO story depends on.
  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <head>
        <script async src={ADSENSE_SCRIPT_URL} crossOrigin="anonymous" />
      </head>
      <body
        className={`${getSansFontClass(locale as Locale)} ${geistMono.variable} min-h-screen bg-bg-dark text-text-primary antialiased`}
      >
        <NextIntlClientProvider>
          <ChangelogBanner />
          {children}
          <Analytics />
          <SpeedInsights />
          <GoogleAnalytics gaId="G-R8BM9EMY9J" />
          <SoundStopNavigator />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
