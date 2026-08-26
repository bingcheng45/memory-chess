import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const siteUrl = 'https://thememorychess.com';

export const metadata: Metadata = {
  title: 'Contact Memory Chess',
  description:
    'Contact Memory Chess for feedback, feature requests, or business inquiries.',
  alternates: {
    canonical: '/contact-us',
  },
  openGraph: {
    title: 'Contact Memory Chess',
    description:
      'Send feedback, feature requests, and partnership inquiries to Memory Chess.',
    url: `${siteUrl}/contact-us`,
  },
  twitter: {
    title: 'Contact Memory Chess',
    description:
      'Send feedback, feature requests, and partnership inquiries to Memory Chess.',
  },
};

export default function ContactLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
