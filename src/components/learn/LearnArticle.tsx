import Link from 'next/link';
import type { LearnPageContent } from '@/lib/seo/learnPages';
import { LEARN_PAGES } from '@/lib/seo/learnPages';
import PageHeader from '@/components/ui/PageHeader';
import Footer from '@/components/ui/Footer';
import { Button } from '@/components/ui/button';

const SITE_URL = 'https://thememorychess.com';

type LearnArticleProps = {
  page: LearnPageContent;
};

function toAbsoluteUrl(pathname: string): string {
  return `${SITE_URL}${pathname}`;
}

export default function LearnArticle({ page }: LearnArticleProps) {
  const siblingPage = LEARN_PAGES.find((entry) => entry.slug === page.siblingSlug);
  const articlePath = `/learn/${page.slug}`;
  const siblingPath = siblingPage ? `/learn/${siblingPage.slug}` : '/learn';

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.h1,
    description: page.description,
    datePublished: page.lastReviewed,
    dateModified: page.lastReviewed,
    inLanguage: 'en-US',
    author: {
      '@type': 'Organization',
      name: 'Memory Chess Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Memory Chess',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/apple-touch-icon.png`,
      },
    },
    mainEntityOfPage: toAbsoluteUrl(articlePath),
    keywords: [page.primaryKeyword, ...page.secondaryKeywords].join(', '),
    about: page.painPoint,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Learn',
        item: `${SITE_URL}/learn`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: page.title,
        item: toAbsoluteUrl(articlePath),
      },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faq.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: entry.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-bg-dark text-text-primary">
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-center mb-8">
          <PageHeader showSoundSettings={false} />
        </div>

        <article className="mx-auto max-w-4xl space-y-10">
          <nav className="text-sm text-text-secondary">
            <Link href="/" className="hover:text-peach-500">
              Home
            </Link>{' '}
            /{' '}
            <Link href="/learn" className="hover:text-peach-500">
              Learn
            </Link>{' '}
            / <span className="text-text-primary">{page.title}</span>
          </nav>

          <header className="rounded-xl border border-bg-light bg-bg-card p-6 sm:p-8">
            <p className="text-sm font-medium text-peach-500 mb-4 uppercase tracking-wide">
              Primary Keyword: {page.primaryKeyword}
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">{page.h1}</h1>
            <p className="text-text-secondary text-lg">{page.intro}</p>
            <div className="mt-6">
              <Link href={page.ctaHref}>
                <Button className="bg-peach-500 hover:bg-peach-600 text-white">
                  {page.ctaLabel}
                </Button>
              </Link>
            </div>
          </header>

          <section aria-labelledby="symptoms">
            <h2 id="symptoms" className="text-2xl font-semibold mb-4">
              Symptoms this page targets
            </h2>
            <ul className="list-disc space-y-3 pl-6 text-text-secondary">
              {page.symptoms.map((symptom) => (
                <li key={symptom}>{symptom}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="routine">
            <h2 id="routine" className="text-2xl font-semibold mb-4">
              {page.routineTitle}
            </h2>
            <ol className="list-decimal space-y-3 pl-6 text-text-secondary">
              {page.routineSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="mistakes">
            <h2 id="mistakes" className="text-2xl font-semibold mb-4">
              Common mistakes that slow progress
            </h2>
            <ul className="list-disc space-y-3 pl-6 text-text-secondary">
              {page.commonMistakes.map((mistake) => (
                <li key={mistake}>{mistake}</li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="links"
            className="rounded-xl border border-bg-light bg-bg-card p-6 sm:p-8"
          >
            <h2 id="links" className="text-2xl font-semibold mb-4">
              Next actions
            </h2>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/game" className="underline text-peach-500 hover:text-peach-400">
                Start a training round
              </Link>
              <Link href="/leaderboard" className="underline text-peach-500 hover:text-peach-400">
                See leaderboard benchmarks
              </Link>
              <Link href={siblingPath} className="underline text-peach-500 hover:text-peach-400">
                Read {page.siblingAnchorText}
              </Link>
            </div>
            <div className="mt-6">
              <Link href={page.ctaHref}>
                <Button className="bg-peach-500 hover:bg-peach-600 text-white">
                  Start training now
                </Button>
              </Link>
            </div>
          </section>

          <section aria-labelledby="faq">
            <h2 id="faq" className="text-2xl font-semibold mb-4">
              FAQ
            </h2>
            <div className="space-y-6">
              {page.faq.map((entry) => (
                <div key={entry.question} className="rounded-lg border border-bg-light p-5">
                  <h3 className="text-lg font-semibold mb-2">{entry.question}</h3>
                  <p className="text-text-secondary">{entry.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </article>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Footer />
    </div>
  );
}
