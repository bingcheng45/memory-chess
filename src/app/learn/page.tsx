import type { Metadata } from 'next';
import LearnHubPageContent from '@/components/learn/LearnHubPageContent';

export const metadata: Metadata = {
  title: 'Memory Chess Learning Center',
  description:
    'Explore beginner-friendly chess guides focused on board vision, visualization, memory training, and practical routines that connect directly to Memory Chess.',
  alternates: {
    canonical: '/learn',
  },
  openGraph: {
    title: 'Memory Chess Learning Center',
    description:
      'Beginner-focused guides for blunder prevention, visualization, board memory, and realistic daily training plans.',
    url: 'https://thememorychess.com/learn',
    images: [
      {
        url: 'https://thememorychess.com/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Memory Chess Learning Center',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Memory Chess Learning Center',
    description:
      'Beginner-focused guides for blunder prevention, visualization, board memory, and realistic daily training plans.',
    images: ['https://thememorychess.com/twitter-image'],
  },
};

export default function LearnHubPage() {
  return <LearnHubPageContent />;
}
