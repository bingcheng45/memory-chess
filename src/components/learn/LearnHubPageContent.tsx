import Image from 'next/image';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import Footer from '@/components/ui/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getFeaturedLearnPages,
  getLearnPagesByGoal,
  getNewestLearnPages,
  LEARN_GOALS,
} from '@/lib/seo/learnPages';
import { ArrowRight, Clock3, Compass, Sparkles, Target, TrendingUp } from 'lucide-react';

const featuredPages = getFeaturedLearnPages(4);
const newestPages = getNewestLearnPages(4);

export default function LearnHubPageContent() {
  return (
    <div className="min-h-screen bg-bg-dark text-text-primary">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-center">
          <PageHeader showSoundSettings={false} />
        </div>

        <section className="mx-auto max-w-7xl rounded-[30px] border border-bg-light bg-gradient-to-br from-bg-card via-bg-card to-black/35 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <Badge className="border-peach-500/30 bg-peach-500/10 text-peach-500" variant="outline">
                  Beginner-focused SEO hub
                </Badge>
                <Badge className="border-bg-light bg-white/5 text-text-primary" variant="outline">
                  Visualization, memory, and blunder prevention
                </Badge>
              </div>
              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
                  Learn chess through board clarity, not random content overload.
                </h1>
                <p className="max-w-3xl text-lg text-text-secondary">
                  This learning center is built for beginners who want fewer blunders, stronger visualization, better board recall, and realistic study plans that connect directly to Memory Chess.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="border-white/10 bg-black/20">
                  <CardContent className="p-5">
                    <p className="mb-2 text-sm uppercase tracking-[0.18em] text-peach-400">Start here</p>
                    <p className="text-sm leading-7 text-text-secondary">
                      Pick one goal and follow its internal path instead of jumping between unrelated topics.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-white/10 bg-black/20">
                  <CardContent className="p-5">
                    <p className="mb-2 text-sm uppercase tracking-[0.18em] text-peach-400">Built for action</p>
                    <p className="text-sm leading-7 text-text-secondary">
                      Every guide includes drills, next reads, and product-linked practice ideas.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-white/10 bg-black/20">
                  <CardContent className="p-5">
                    <p className="mb-2 text-sm uppercase tracking-[0.18em] text-peach-400">Audience</p>
                    <p className="text-sm leading-7 text-text-secondary">
                      Absolute beginners to early intermediates who want cleaner practical games.
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button asChild className="bg-peach-500 text-white hover:bg-peach-600">
                  <Link href="/learn/how-to-get-better-at-chess-for-beginners">
                    Start with the beginner roadmap
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-peach-500/30 bg-peach-500/10 text-peach-400 hover:bg-peach-500/20 hover:text-peach-300"
                >
                  <Link href="/game">Open Memory Chess</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {featuredPages.slice(0, 4).map((page) => (
                <Link key={page.slug} href={`/learn/${page.slug}`} className="group">
                  <Card className="h-full overflow-hidden border-white/10 bg-black/20 transition-transform duration-200 group-hover:-translate-y-1">
                    <div className="overflow-hidden border-b border-white/10">
                      <Image
                        src={page.coverImage}
                        alt={page.title}
                        width={640}
                        height={360}
                        className="h-auto w-full transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                    <CardHeader>
                      <CardDescription className="text-peach-400">{LEARN_GOALS[page.goal].label}</CardDescription>
                      <CardTitle className="text-xl leading-tight">{page.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm leading-7 text-text-secondary">
                      {page.quickAnswer}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto mt-12 max-w-7xl">
          <div className="mb-6 flex items-center gap-3">
            <Compass className="h-5 w-5 text-peach-500" />
            <div>
              <h2 className="text-3xl font-bold">Start here by goal</h2>
              <p className="mt-1 text-text-secondary">
                Each path is built as a small internal cluster so you can move from broad guidance into the right niche guide.
              </p>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {Object.entries(LEARN_GOALS).map(([goalId, goal]) => {
              const pages = getLearnPagesByGoal(goalId as keyof typeof LEARN_GOALS).slice(0, 3);

              return (
                <Card key={goalId} className="border-bg-light bg-bg-card">
                  <CardHeader>
                    <CardDescription className="text-peach-400">{goal.accent}</CardDescription>
                    <CardTitle className="text-2xl">{goal.label}</CardTitle>
                    <p className="text-sm leading-7 text-text-secondary">{goal.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    {pages.map((page, index) => (
                      <Link
                        key={page.slug}
                        href={`/learn/${page.slug}`}
                        className="block rounded-2xl border border-bg-light/80 bg-black/20 p-4 transition-colors hover:border-peach-500/30"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm uppercase tracking-[0.18em] text-peach-400">
                              Step {index + 1}
                            </p>
                            <h3 className="mt-1 text-lg font-semibold">{page.title}</h3>
                            <p className="mt-2 text-sm leading-7 text-text-secondary">{page.painPoint}</p>
                          </div>
                          <ArrowRight className="h-5 w-5 shrink-0 text-peach-500" />
                        </div>
                      </Link>
                    ))}
                    <Button
                      asChild
                      variant="outline"
                      className="w-full border-peach-500/30 bg-peach-500/10 text-peach-400 hover:bg-peach-500/20 hover:text-peach-300"
                    >
                      <Link href={goal.href}>Open this path</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-7xl grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-peach-500" />
              <div>
                <h2 className="text-3xl font-bold">Featured guides</h2>
                <p className="mt-1 text-text-secondary">
                  These are the strongest entry points for the niche-led content cluster.
                </p>
              </div>
            </div>
            <div className="grid gap-6">
              {featuredPages.map((page) => (
                <Card key={`featured-${page.slug}`} className="overflow-hidden border-bg-light bg-bg-card">
                  <div className="grid gap-0 md:grid-cols-[280px_1fr]">
                    <div className="overflow-hidden border-b border-bg-light/80 md:border-b-0 md:border-r">
                      <Image
                        src={page.coverImage}
                        alt={page.title}
                        width={640}
                        height={360}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <div className="mb-4 flex flex-wrap items-center gap-3">
                        <Badge className="border-peach-500/30 bg-peach-500/10 text-peach-500" variant="outline">
                          {LEARN_GOALS[page.goal].label}
                        </Badge>
                        <span className="inline-flex items-center gap-2 text-sm text-text-secondary">
                          <Clock3 className="h-4 w-4 text-peach-500" />
                          {page.timeToRead}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold">{page.title}</h3>
                      <p className="mt-3 text-text-secondary">{page.quickAnswer}</p>
                      <div className="mt-5 flex flex-wrap gap-4">
                        <Button asChild className="bg-peach-500 text-white hover:bg-peach-600">
                          <Link href={`/learn/${page.slug}`}>Read guide</Link>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          className="border-peach-500/30 bg-peach-500/10 text-peach-400 hover:bg-peach-500/20 hover:text-peach-300"
                        >
                          <Link href="/game">Practice now</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="border-bg-light bg-bg-card">
              <CardHeader>
                <CardDescription className="text-peach-400">Newest and updated</CardDescription>
                <CardTitle className="text-2xl">Best next reads</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {newestPages.map((page) => (
                  <Link
                    key={`newest-${page.slug}`}
                    href={`/learn/${page.slug}`}
                    className="block rounded-2xl border border-bg-light/80 bg-black/20 p-4 transition-colors hover:border-peach-500/30"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.18em] text-peach-400">
                          {LEARN_GOALS[page.goal].label}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold">{page.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-text-secondary">{page.painPoint}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 shrink-0 text-peach-500" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="border-peach-500/20 bg-gradient-to-b from-peach-500/10 to-transparent">
              <CardHeader>
                <CardDescription className="text-peach-400">Use the product</CardDescription>
                <CardTitle className="text-2xl">Turn reading into training</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <p className="text-sm leading-7 text-text-secondary">
                  Every guide assumes you will run at least one Memory Chess drill while the advice is still fresh. That is where the site becomes different from a generic chess article library.
                </p>
                <Button asChild className="w-full bg-peach-500 text-white hover:bg-peach-600">
                  <Link href="/game">Open Memory Chess</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-bg-light bg-bg-card">
              <CardHeader>
                <CardDescription className="text-peach-400">What this hub targets</CardDescription>
                <CardTitle className="text-2xl">Search intent focus</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 text-sm leading-7 text-text-secondary">
                <p className="inline-flex items-start gap-3">
                  <TrendingUp className="mt-1 h-4 w-4 shrink-0 text-peach-500" />
                  Broad beginner chess queries that need a clear first-step plan.
                </p>
                <p className="inline-flex items-start gap-3">
                  <Target className="mt-1 h-4 w-4 shrink-0 text-peach-500" />
                  Niche problems around board vision, recall, visualization, and blunder control.
                </p>
                <p className="inline-flex items-start gap-3">
                  <Sparkles className="mt-1 h-4 w-4 shrink-0 text-peach-500" />
                  Product-linked training intent where the article can lead naturally into a Memory Chess session.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
