import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

// Import Vercel packages dynamically to avoid build errors
import dynamic from 'next/dynamic';
const Analytics = dynamic(() => import('@vercel/analytics/react').then(mod => mod.Analytics));
const SpeedInsights = dynamic(() => import('@vercel/speed-insights/next').then(mod => mod.SpeedInsights));

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Memory Chess - Train Your Chess Visualization',
  description: 'Improve your chess memory and visualization skills with interactive training exercises',
  keywords: ['chess', 'memory', 'training', 'visualization', 'chess training'],
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
      </body>
    </html>
  );
}
