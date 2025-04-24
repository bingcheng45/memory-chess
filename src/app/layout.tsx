import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

// Import Vercel packages dynamically to avoid build errors
import dynamic from 'next/dynamic';
const Analytics = dynamic(() => import('@vercel/analytics/react').then(mod => mod.Analytics));
const SpeedInsights = dynamic(() => import('@vercel/speed-insights/next').then(mod => mod.SpeedInsights));
import { GoogleAnalytics } from "@next/third-parties/google";
import SoundStopNavigator from '@/components/common/SoundStopNavigator';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Define your site URL for canonical and OG URLs
const siteUrl = 'https://memory-chess.vercel.app';

export const metadata: Metadata = {
  // Basic Metadata
  title: {
    default: 'Memory Chess - Train Your Chess Visualization and Spatial Memory',
    template: '%s | Memory Chess',
  },
  description: 'Enhance your chess visualization, spatial memory, and cognitive skills through interactive board memorization exercises. Train like grandmasters with Memory Chess.',
  keywords: [
    'chess memory', 'chess visualization', 'spatial memory training', 
    'chess board memory', 'memory improvement', 'chess training', 
    'visualization skills', 'cognitive enhancement', 'chess exercises',
    'board memory', 'grandmaster techniques', 'memory chess'
  ],
  
  // Viewport
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },

  // Canonical link - helps prevent duplicate content issues
  alternates: {
    canonical: siteUrl,
  },

  // Icons
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon-16x16.png',
  },

  // Open Graph (Facebook, LinkedIn) metadata
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: 'Memory Chess - Train Your Visualization Skills Like a Grandmaster',
    description: 'Improve your spatial visualization and memory with chess-based cognitive training exercises',
    siteName: 'Memory Chess',
    images: [
      {
        url: `${siteUrl}/images/memory-chess-og.png`,
        width: 1200,
        height: 630,
        alt: 'Memory Chess - Train Your Chess Memory',
      },
    ],
  },

  // Twitter metadata
  twitter: {
    card: 'summary_large_image',
    title: 'Memory Chess - Chess Visualization Training',
    description: 'Enhance your memory and spatial visualization skills with chess-based training exercises',
    images: [`${siteUrl}/images/memory-chess-twitter.png`],
    creator: '@memorychess',
  },

  // Robots - default Next.js sets index, follow
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Verification for search consoles (add yours when available)
  verification: {
    // google: 'your-google-site-verification',
    // bing: 'your-bing-verification',
  },

  // App information for progressive web app
  applicationName: 'Memory Chess',
  appleWebApp: {
    title: 'Memory Chess',
    statusBarStyle: 'black-translucent',
    capable: true,
  },
  
  // Content type
  metadataBase: new URL(siteUrl),
  themeColor: '#1D1C20', // Your dark background color
  colorScheme: 'dark',
  creator: 'Memory Chess Team',
  publisher: 'Memory Chess',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-bg-dark text-text-primary antialiased`}>
        {children}
        <Analytics />
        <SpeedInsights />
        <GoogleAnalytics gaId="G-R8BM9EMY9J" />
        <SoundStopNavigator />
      </body>
    </html>
  );
}
