import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Memory Chess Settings',
  description: 'Customize your Memory Chess game settings and preferences.',
  alternates: {
    canonical: '/settings',
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
