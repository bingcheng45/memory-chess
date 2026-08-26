import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const siteUrl = 'https://thememorychess.com';

export const metadata: Metadata = {
  title: 'Play Memory Chess Online',
  description:
    'Play Memory Chess online to train board visualization, recall, and chess pattern recognition with timed memory challenges.',
  alternates: {
    canonical: '/game',
  },
  openGraph: {
    title: 'Play Memory Chess Online',
    description:
      'Train your chess visualization and memory with interactive timed challenges.',
    url: `${siteUrl}/game`,
  },
  twitter: {
    title: 'Play Memory Chess Online',
    description:
      'Train your chess visualization and memory with interactive timed challenges.',
  },
};

export default function GameLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
