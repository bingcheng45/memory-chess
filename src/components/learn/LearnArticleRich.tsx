import Image from 'next/image';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import Footer from '@/components/ui/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  LEARN_GOALS,
  LEARN_PAGES,
  type LearnComparisonRow,
  type LearnPageContent,
} from '@/lib/seo/learnPages';
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock3,
  Compass,
  ExternalLink,
  Layers,
  ListChecks,
  Sparkles,
  Target,
} from 'lucide-react';
import LearnArticleTracking from '@/components/learn/LearnArticleTracking';

const SITE_URL = 'https://thememorychess.com';

type LearnArticleProps = {
  page: LearnPageContent;
};

function toAbsoluteUrl(pathname: string): string {
  return `${SITE_URL}${pathname}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function buildRelatedPageData(page: LearnPageContent) {
  return page.relatedArticles
    .map((entry) => {
      const relatedPage = LEARN_PAGES.find((candidate) => candidate.slug === entry.slug);

      if (!relatedPage) {
        return null;
      }

      return {
        ...entry,
        page: relatedPage,
      };
    })
    .filter(Boolean) as Array<{
    slug: string;
    reason: string;
    page: LearnPageContent;
  }>;
}

function renderComparisonRows(rows: LearnComparisonRow[]) {
  return rows.map((row) => (
    <tr key={row.label} className="border-t border-bg-light/80">
      <th scope="row" className="px-4 py-4 text-left align-top text-sm font-semibold text-text-primary">
        {row.label}
      </th>
      <td className="px-4 py-4 text-sm text-text-secondary">{row.struggling}</td>
      <td className="px-4 py-4 text-sm text-text-secondary">{row.stronger}</td>
    </tr>
  ));
}

export default function LearnArticleRich({ page }: LearnArticleProps) {
  const goal = LEARN_GOALS[page.goal];
  const articlePath = `/learn/${page.slug}`;
  const relatedPages = buildRelatedPageData(page);
  const coverImageUrl = toAbsoluteUrl(page.coverImage);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.h1,
    description: page.description,
    image: [coverImageUrl],
    datePublished: page.publishedAt,
    dateModified: page.updatedAt,
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    articleSection: goal.label,
    author: {
      '@type': 'Organization',
      name: 'Memory Chess Editorial Team',
      url: SITE_URL,
    },
    reviewedBy: {
      '@type': 'Organization',
      name: page.reviewedBy,
      url: `${SITE_URL}/learn`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Memory Chess',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/apple-touch-icon.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': toAbsoluteUrl(articlePath),
    },
    keywords: [page.primaryKeyword, ...page.secondaryKeywords].join(', '),
    about: page.painPoint,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Learn', item: `${SITE_URL}/learn` },
      { '@type': 'ListItem', position: 3, name: page.title, item: toAbsoluteUrl(articlePath) },
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
      <LearnArticleTracking page={page} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-center">
          <PageHeader showSoundSettings={false} />
        </div>

        <article className="mx-auto max-w-7xl">
          <nav className="mb-6 text-sm text-text-secondary">
            <Link href="/" className="hover:text-peach-500">
              Home
            </Link>{' '}
            /{' '}
            <Link href="/learn" className="hover:text-peach-500">
              Learn
            </Link>{' '}
            / <span className="text-text-primary">{page.title}</span>
          </nav>

          <header className="overflow-hidden rounded-[28px] border border-bg-light bg-gradient-to-br from-bg-card via-bg-card to-black/40 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
            <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="border-peach-500/30 bg-peach-500/10 text-peach-500" variant="outline">
                    {goal.label}
                  </Badge>
                  <Badge className="border-bg-light bg-white/5 text-text-primary" variant="outline">
                    {page.timeToRead}
                  </Badge>
                  <Badge className="border-bg-light bg-white/5 text-text-primary" variant="outline">
                    {page.difficulty}
                  </Badge>
                </div>
                <div className="space-y-4">
                  <p className="text-sm uppercase tracking-[0.2em] text-peach-500">
                    Primary keyword: {page.primaryKeyword}
                  </p>
                  <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{page.h1}</h1>
                  <p className="max-w-2xl text-lg text-text-secondary">{page.description}</p>
                </div>
                <Card className="border-peach-500/20 bg-black/25">
                  <CardHeader className="pb-4">
                    <CardDescription className="text-sm uppercase tracking-[0.18em] text-peach-400">
                      Start here
                    </CardDescription>
                    <CardTitle className="text-2xl leading-tight">{page.quickAnswer}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-6 pt-0 sm:grid-cols-2">
                    <div>
                      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-text-primary">
                        <CheckCircle2 className="h-4 w-4 text-peach-500" />
                        Key takeaways
                      </h2>
                      <ul className="space-y-3 text-sm text-text-secondary">
                        {page.keyTakeaways.map((takeaway) => (
                          <li key={takeaway} className="flex gap-3">
                            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-peach-500" />
                            <span>{takeaway}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-text-primary">
                        <Target className="h-4 w-4 text-peach-500" />
                        Who this is for
                      </h2>
                      <ul className="space-y-3 text-sm text-text-secondary">
                        {page.whoThisIsFor.map((item) => (
                          <li key={item} className="flex gap-3">
                            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-peach-500" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex flex-wrap items-center gap-4">
                  <Button asChild className="bg-peach-500 text-white hover:bg-peach-600" data-learn-cta="hero-primary">
                    <Link href={page.ctaHref}>{page.ctaLabel}</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-peach-500/30 bg-peach-500/10 text-peach-400 hover:bg-peach-500/20 hover:text-peach-300"
                    data-learn-cta="hero-secondary"
                  >
                    <Link href="/learn">Browse all guides</Link>
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-text-secondary">
                  <span className="inline-flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-peach-500" />
                    Updated {formatDate(page.updatedAt)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Brain className="h-4 w-4 text-peach-500" />
                    Reviewed by {page.reviewedBy}
                  </span>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-black/20 p-4">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,159,67,0.18),transparent_52%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_45%)]" />
                <div className="relative space-y-4">
                  <div className="overflow-hidden rounded-[18px] border border-white/10 bg-black/30">
                    <Image
                      src={page.coverImage}
                      alt={page.title}
                      width={960}
                      height={540}
                      className="h-auto w-full"
                      priority
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Card className="border-white/10 bg-black/30">
                      <CardContent className="p-5">
                        <p className="mb-2 text-sm uppercase tracking-[0.18em] text-peach-400">Focus</p>
                        <p className="text-sm text-text-secondary">{goal.description}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-black/30">
                      <CardContent className="p-5">
                        <p className="mb-2 text-sm uppercase tracking-[0.18em] text-peach-400">Pain point</p>
                        <p className="text-sm text-text-secondary">{page.painPoint}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-10">
              <section className="rounded-3xl border border-bg-light bg-bg-card p-5 sm:p-6 lg:hidden">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-peach-500">
                  <Compass className="h-4 w-4" />
                  Jump to
                </h2>
                <div className="flex flex-wrap gap-3">
                  {page.tableOfContents.map((item) => (
                    <Link
                      key={item.id}
                      href={`#${item.id}`}
                      className="rounded-full border border-bg-light bg-black/20 px-4 py-2 text-sm text-text-secondary transition-colors hover:border-peach-500/30 hover:text-peach-400"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </section>

              {page.contentSections.map((section, index) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-24 rounded-3xl border border-bg-light bg-bg-card p-6 sm:p-8"
                >
                  <div className="mb-6 space-y-3">
                    {section.eyebrow ? (
                      <p className="text-sm uppercase tracking-[0.2em] text-peach-500">{section.eyebrow}</p>
                    ) : null}
                    <h2 className="text-2xl font-bold sm:text-3xl">{section.title}</h2>
                    {section.summary ? (
                      <p className="max-w-3xl text-text-secondary">{section.summary}</p>
                    ) : null}
                  </div>

                  {section.paragraphs ? (
                    <div className="space-y-4 text-base leading-8 text-text-secondary">
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  ) : null}

                  {section.orderedBullets ? (
                    <ol className="mt-6 grid gap-4">
                      {section.orderedBullets.map((bullet, bulletIndex) => (
                        <li
                          key={bullet}
                          className="flex gap-4 rounded-2xl border border-bg-light/80 bg-black/20 p-4 text-text-secondary"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-peach-500 font-semibold text-white">
                            {bulletIndex + 1}
                          </span>
                          <span className="leading-7">{bullet}</span>
                        </li>
                      ))}
                    </ol>
                  ) : null}

                  {section.bullets ? (
                    <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                      {section.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="rounded-2xl border border-bg-light/80 bg-black/20 p-4 text-sm leading-7 text-text-secondary"
                        >
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {section.drillCards ? (
                    <div className="mt-6 grid gap-5 lg:grid-cols-3">
                      {section.drillCards.map((drill) => (
                        <Card key={drill.title} className="border-peach-500/15 bg-black/25">
                          <CardHeader>
                            <CardDescription className="inline-flex items-center gap-2 text-peach-400">
                              <Sparkles className="h-4 w-4" />
                              {drill.duration}
                            </CardDescription>
                            <CardTitle className="text-xl">{drill.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4 pt-0">
                            <p className="text-sm leading-7 text-text-secondary">{drill.description}</p>
                            <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-text-secondary">
                              {drill.goal}
                            </p>
                            <Button
                              asChild
                              variant="outline"
                              className="w-full border-peach-500/25 bg-peach-500/10 text-peach-400 hover:bg-peach-500/20 hover:text-peach-300"
                              data-learn-cta={`section-drill-${section.id}`}
                            >
                              <Link href={drill.href}>{drill.ctaLabel}</Link>
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : null}

                  {section.comparisonRows ? (
                    <div className="mt-6 overflow-hidden rounded-2xl border border-bg-light/80 bg-black/20">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-white/5">
                            {section.comparisonColumns?.map((column) => (
                              <th
                                key={column}
                                scope="col"
                                className="px-4 py-3 text-left text-xs uppercase tracking-[0.18em] text-text-secondary"
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>{renderComparisonRows(section.comparisonRows)}</tbody>
                      </table>
                    </div>
                  ) : null}

                  {section.planSteps ? (
                    <div className="mt-6 grid gap-4">
                      {section.planSteps.map((step) => (
                        <div
                          key={step.label}
                          className="flex flex-col gap-3 rounded-2xl border border-bg-light/80 bg-black/20 p-5 sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div>
                            <p className="text-sm uppercase tracking-[0.18em] text-peach-400">{step.label}</p>
                            <h3 className="mt-1 text-lg font-semibold">{step.duration}</h3>
                          </div>
                          <p className="max-w-3xl text-sm leading-7 text-text-secondary">{step.detail}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {section.callout ? (
                    <Card className="mt-6 border-peach-500/20 bg-peach-500/8">
                      <CardHeader className="pb-3">
                        <CardDescription className="text-peach-400">{section.callout.title}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0 text-sm leading-7 text-text-secondary">
                        {section.callout.body}
                      </CardContent>
                    </Card>
                  ) : null}

                  {index === 1 ? (
                    <Card className="mt-8 border-peach-500/20 bg-gradient-to-r from-peach-500/12 to-transparent">
                      <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="max-w-2xl">
                          <p className="mb-2 text-sm uppercase tracking-[0.18em] text-peach-400">
                            Practice while this is fresh
                          </p>
                          <h3 className="text-xl font-bold">Use one live round before you read further.</h3>
                          <p className="mt-2 text-sm leading-7 text-text-secondary">
                            The fastest way to make this guide useful is to test the drill sequence immediately, then come back and keep reading with your own mistakes in mind.
                          </p>
                        </div>
                        <Button asChild className="bg-peach-500 text-white hover:bg-peach-600" data-learn-cta="mid-article">
                          <Link href={page.ctaHref}>Start a training round</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ) : null}
                </section>
              ))}

              <section className="rounded-3xl border border-bg-light bg-bg-card p-6 sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <Layers className="h-5 w-5 text-peach-500" />
                  <div>
                    <h2 className="text-2xl font-bold">Related training paths</h2>
                    <p className="mt-1 text-text-secondary">
                      Use these internal routes to keep the learning path coherent instead of jumping to random topics.
                    </p>
                  </div>
                </div>
                <div className="grid gap-5 lg:grid-cols-3">
                  {relatedPages.map((entry) => (
                    <Card key={entry.slug} className="border-bg-light/90 bg-black/20">
                      <CardHeader>
                        <CardDescription className="text-peach-400">
                          {LEARN_GOALS[entry.page.goal].label}
                        </CardDescription>
                        <CardTitle className="text-xl leading-tight">{entry.page.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-0">
                        <p className="text-sm leading-7 text-text-secondary">{entry.reason}</p>
                        <Button
                          asChild
                          variant="outline"
                          className="w-full border-peach-500/25 bg-peach-500/10 text-peach-400 hover:bg-peach-500/20 hover:text-peach-300"
                        >
                          <Link href={`/learn/${entry.slug}`} data-learn-link={entry.slug}>
                            Read this guide
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-bg-light bg-bg-card p-6 sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-peach-500" />
                  <div>
                    <h2 className="text-2xl font-bold">Memory Chess drill ideas</h2>
                    <p className="mt-1 text-text-secondary">
                      These are the drills this article expects you to use inside the product.
                    </p>
                  </div>
                </div>
                <div className="grid gap-5 lg:grid-cols-3">
                  {page.relatedDrills.map((drill) => (
                    <Card key={`${page.slug}-${drill.title}`} className="border-white/10 bg-black/20">
                      <CardHeader>
                        <CardDescription className="text-peach-400">{drill.duration}</CardDescription>
                        <CardTitle className="text-xl">{drill.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-0">
                        <p className="text-sm leading-7 text-text-secondary">{drill.description}</p>
                        <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-text-secondary">
                          {drill.goal}
                        </p>
                        <Button asChild className="w-full bg-peach-500 text-white hover:bg-peach-600" data-learn-cta="end-drill">
                          <Link href={drill.href}>{drill.ctaLabel}</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              <section id="faq" className="rounded-3xl border border-bg-light bg-bg-card p-6 sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <ListChecks className="h-5 w-5 text-peach-500" />
                  <div>
                    <h2 className="text-2xl font-bold">FAQ</h2>
                    <p className="mt-1 text-text-secondary">
                      These answers stay on the page for users. They are not included here as a rich-result bet.
                    </p>
                  </div>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  {page.faq.map((entry, index) => (
                    <AccordionItem key={entry.question} value={`item-${index}`} className="border-bg-light/80">
                      <AccordionTrigger className="text-base text-text-primary">
                        {entry.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm leading-7 text-text-secondary">
                        {entry.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>

              <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <Card className="border-bg-light bg-bg-card">
                  <CardHeader>
                    <CardDescription className="text-peach-400">Editorial standards</CardDescription>
                    <CardTitle className="text-2xl">Why this page is structured this way</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0 text-sm leading-7 text-text-secondary">
                    <p>
                      Every learn guide is written for absolute beginners to early intermediates and is reviewed by the Memory Chess editorial team.
                    </p>
                    <p>
                      The standard is simple: direct answer first, one drill that connects to product usage, one clear internal path to the next guide, and one concrete metric the reader can track after leaving the page.
                    </p>
                    <p>
                      Published {formatDate(page.publishedAt)}. Last updated {formatDate(page.updatedAt)}.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-bg-light bg-bg-card">
                  <CardHeader>
                    <CardDescription className="text-peach-400">Sources used</CardDescription>
                    <CardTitle className="text-2xl">Reference links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    {page.sources.map((source) => (
                      <a
                        key={source.url}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-2xl border border-bg-light/80 bg-black/20 p-4 transition-colors hover:border-peach-500/30"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-text-primary">{source.title}</h3>
                            <p className="mt-2 text-sm leading-7 text-text-secondary">{source.note}</p>
                          </div>
                          <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-peach-500" />
                        </div>
                      </a>
                    ))}
                  </CardContent>
                </Card>
              </section>
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-5">
                <Card className="border-bg-light bg-bg-card">
                  <CardHeader>
                    <CardDescription className="text-peach-400">On this page</CardDescription>
                    <CardTitle className="text-xl">Jump links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {page.tableOfContents.map((item) => (
                      <Link
                        key={item.id}
                        href={`#${item.id}`}
                        className="block rounded-xl px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-white/5 hover:text-peach-400"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-peach-500/20 bg-gradient-to-b from-peach-500/10 to-transparent">
                  <CardHeader>
                    <CardDescription className="text-peach-400">Best next action</CardDescription>
                    <CardTitle className="text-xl">Practice before you click away</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <p className="text-sm leading-7 text-text-secondary">
                      Run a short Memory Chess session now, then come back and compare what felt easier or harder on the board.
                    </p>
                    <Button asChild className="w-full bg-peach-500 text-white hover:bg-peach-600" data-learn-cta="sidebar">
                      <Link href={page.ctaHref}>Open Memory Chess</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-bg-light bg-bg-card">
                  <CardHeader>
                    <CardDescription className="text-peach-400">Best next reads</CardDescription>
                    <CardTitle className="text-xl">Continue the cluster</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    {relatedPages.slice(0, 3).map((entry) => (
                      <Link
                        key={`sidebar-${entry.slug}`}
                        href={`/learn/${entry.slug}`}
                        data-learn-link={entry.slug}
                        className="block rounded-2xl border border-bg-light/80 bg-black/20 p-4 transition-colors hover:border-peach-500/30"
                      >
                        <p className="text-sm font-semibold text-text-primary">{entry.page.title}</p>
                        <p className="mt-2 text-sm leading-7 text-text-secondary">{entry.reason}</p>
                        <span className="mt-3 inline-flex items-center gap-2 text-sm text-peach-400">
                          Read next <ArrowRight className="h-4 w-4" />
                        </span>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </aside>
          </div>
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
