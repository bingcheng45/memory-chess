import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Define your site URL for canonical and OG URLs
const siteUrl = "https://thememorychess.com";

export const metadata: Metadata = {
  // Basic Metadata
  title: {
    default: "Memory Chess: Free Chess Memory and Visualization Game",
    template: "%s | Memory Chess",
  },
  description:
    "Memorize a chess position, rebuild it from memory, and get an instant score. Play free to train board vision, visualization, and spatial memory.",

  // Canonical for home route; child routes override via route metadata
  alternates: {
    canonical: "/",
  },

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
    images: [
      {
        url: `${siteUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Memory Chess - Train Your Chess Memory",
      },
    ],
  },

  // Twitter metadata
  twitter: {
    card: "summary_large_image",
    title: "Memory Chess: Free Chess Memory Game",
    description:
      "Memorize a chess position, rebuild it, and improve your board vision one round at a time.",
    images: [`${siteUrl}/twitter-image`],
    creator: "@memorychess",
  },

  // Robots - default Next.js sets index, follow
  robots: {
    index: true,
    follow: true,
    nocache: true,
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1D1C20",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script async src={ADSENSE_SCRIPT_URL} crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-bg-dark text-text-primary antialiased`}
      >
        <ChangelogBanner />
        {children}
        <Analytics />
        <SpeedInsights />
        <GoogleAnalytics gaId="G-R8BM9EMY9J" />
        <SoundStopNavigator />
      </body>
    </html>
  );
}
