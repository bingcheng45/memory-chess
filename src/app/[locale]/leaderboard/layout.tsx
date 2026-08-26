import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const siteUrl = 'https://thememorychess.com';

export const metadata: Metadata = {
  title: 'Memory Chess Leaderboard',
  description:
    'View top Memory Chess players by difficulty, accuracy, memorization speed, and solution time.',
  alternates: {
    canonical: '/leaderboard',
  },
  openGraph: {
    title: 'Memory Chess Leaderboard',
    description:
      'See how players rank in memory-based chess visualization challenges.',
    url: `${siteUrl}/leaderboard`,
  },
  twitter: {
    title: 'Memory Chess Leaderboard',
    description:
      'See how players rank in memory-based chess visualization challenges.',
  },
};

export default function LeaderboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
