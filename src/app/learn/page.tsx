import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import Footer from '@/components/ui/Footer';
import { Button } from '@/components/ui/button';
import { LEARN_PAGES } from '@/lib/seo/learnPages';

export const metadata: Metadata = {
  title: 'Memory Chess Learning Center',
  description:
    'Explore beginner-friendly chess and memory training guides focused on visualization, board vision, and practical improvement routines.',
  alternates: {
    canonical: '/learn',
  },
  openGraph: {
    title: 'Memory Chess Learning Center',
    description:
      'Beginner-focused guides for chess visualization, board memory, and practical training routines.',
    url: 'https://thememorychess.com/learn',
  },
  twitter: {
    title: 'Memory Chess Learning Center',
    description:
      'Beginner-focused guides for chess visualization, board memory, and practical training routines.',
  },
};

export default function LearnHubPage() {
  return (
    <div className="min-h-screen bg-bg-dark text-text-primary">
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-center mb-8">
          <PageHeader showSoundSettings={false} />
        </div>

        <section className="mx-auto max-w-5xl">
          <header className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
              Memory Chess Learning Center
            </h1>
            <p className="text-text-secondary text-lg max-w-3xl mx-auto">
              Use practical guides built for chess beginners who want better board
              visualization, fewer blunders, and consistent training progress.
            </p>
            <div className="mt-6">
              <Link href="/game">
                <Button className="bg-peach-500 hover:bg-peach-600 text-white">
                  Start training in game mode
                </Button>
              </Link>
            </div>
          </header>

          <div className="grid gap-6 md:grid-cols-2">
            {LEARN_PAGES.map((page) => (
              <article
                key={page.slug}
                className="rounded-xl border border-bg-light bg-bg-card p-6"
              >
                <p className="text-xs uppercase tracking-wide text-peach-500 mb-2">
                  {page.primaryKeyword}
                </p>
                <h2 className="text-2xl font-semibold mb-3">{page.title}</h2>
                <p className="text-text-secondary mb-4">{page.description}</p>
                <p className="text-sm text-text-secondary mb-6">
                  Pain point: {page.painPoint}
                </p>
                <div className="flex items-center justify-between gap-3">
                  <Link
                    href={`/learn/${page.slug}`}
                    className="underline text-peach-500 hover:text-peach-400"
                  >
                    Read guide
                  </Link>
                  <Link href={page.ctaHref}>
                    <Button
                      variant="outline"
                      className="bg-peach-500/10 text-peach-500 border-peach-500/30 hover:bg-peach-500/20 hover:text-peach-400"
                    >
                      {page.ctaLabel}
                    </Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
