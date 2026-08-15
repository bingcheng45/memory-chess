import Image from "next/image";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Footer from "@/components/ui/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getFeaturedLearnPages,
  getLearnPagesByGoal,
  getNewestLearnPages,
  LEARN_GOALS,
} from "@/lib/seo/learnPages";
import {
  ArrowRight,
  Clock3,
  Compass,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

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
                <Badge
                  className="border-peach-500/30 bg-peach-500/10 text-peach-500"
                  variant="outline"
                >
                  Made for beginners
                </Badge>
                <Badge
                  className="border-bg-light bg-white/5 text-text-primary"
                  variant="outline"
                >
                  Board vision, memory, and fewer blunders
                </Badge>
              </div>
              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
                  Learn Chess One Clear Step at a Time
                </h1>
                <p className="max-w-3xl text-lg text-text-secondary">
                  Choose what you want to improve. Each guide explains the idea
                  in plain English and gives you a short drill to try in Memory
                  Chess.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="border-white/10 bg-black/20">
                  <CardContent className="p-5">
                    <p className="mb-2 text-sm uppercase tracking-[0.18em] text-peach-400">
                      Start here
                    </p>
                    <p className="text-sm leading-7 text-text-secondary">
                      Choose one goal below. Read the first guide, try its
                      drill, and then move to the next step.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-white/10 bg-black/20">
                  <CardContent className="p-5">
                    <p className="mb-2 text-sm uppercase tracking-[0.18em] text-peach-400">
                      Practice as you read
                    </p>
                    <p className="text-sm leading-7 text-text-secondary">
                      Every guide includes short exercises and a quick way to
                      start a Memory Chess round.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-white/10 bg-black/20">
                  <CardContent className="p-5">
                    <p className="mb-2 text-sm uppercase tracking-[0.18em] text-peach-400">
                      Who it is for
                    </p>
                    <p className="text-sm leading-7 text-text-secondary">
                      New and improving players who want fewer mistakes and a
                      clearer picture of the board.
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button
                  asChild
                  className="bg-peach-500 text-white hover:bg-peach-600"
                >
                  <Link href="/learn/how-to-get-better-at-chess-for-beginners">
                    Start the Beginner Guide
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-peach-500/30 bg-peach-500/10 text-peach-400 hover:bg-peach-500/20 hover:text-peach-300"
                >
                  <Link href="/game">Play Memory Chess</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {featuredPages.slice(0, 4).map((page) => (
                <Link
                  key={page.slug}
                  href={`/learn/${page.slug}`}
                  className="group"
                >
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
                      <CardDescription className="text-peach-400">
                        {LEARN_GOALS[page.goal].label}
                      </CardDescription>
                      <CardTitle className="text-xl leading-tight">
                        {page.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm leading-7 text-text-secondary">
                      {page.description}
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
              <h2 className="text-3xl font-bold">Choose a Goal</h2>
              <p className="mt-1 text-text-secondary">
                Pick what you want to improve. Each path starts with three
                guides in a useful order.
              </p>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {Object.entries(LEARN_GOALS).map(([goalId, goal]) => {
              const pages = getLearnPagesByGoal(
                goalId as keyof typeof LEARN_GOALS,
              ).slice(0, 3);

              return (
                <Card key={goalId} className="border-bg-light bg-bg-card">
                  <CardHeader>
                    <CardDescription className="text-peach-400">
                      {goal.accent}
                    </CardDescription>
                    <CardTitle className="text-2xl">{goal.label}</CardTitle>
                    <p className="text-sm leading-7 text-text-secondary">
                      {goal.description}
                    </p>
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
                            <h3 className="mt-1 text-lg font-semibold">
                              {page.title}
                            </h3>
                            <p className="mt-2 text-sm leading-7 text-text-secondary">
                              {page.painPoint}
                            </p>
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
                      <Link href={goal.href}>View This Goal</Link>
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
                  Good places to start if you are not sure what to read first.
                </p>
              </div>
            </div>
            <div className="grid gap-6">
              {featuredPages.map((page) => (
                <Card
                  key={`featured-${page.slug}`}
                  className="overflow-hidden border-bg-light bg-bg-card"
                >
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
                        <Badge
                          className="border-peach-500/30 bg-peach-500/10 text-peach-500"
                          variant="outline"
                        >
                          {LEARN_GOALS[page.goal].label}
                        </Badge>
                        <span className="inline-flex items-center gap-2 text-sm text-text-secondary">
                          <Clock3 className="h-4 w-4 text-peach-500" />
                          {page.timeToRead}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold">{page.title}</h3>
                      <p className="mt-3 text-text-secondary">
                        {page.description}
                      </p>
                      <div className="mt-5 flex flex-wrap gap-4">
                        <Button
                          asChild
                          className="bg-peach-500 text-white hover:bg-peach-600"
                        >
                          <Link href={`/learn/${page.slug}`}>Read Guide</Link>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          className="border-peach-500/30 bg-peach-500/10 text-peach-400 hover:bg-peach-500/20 hover:text-peach-300"
                        >
                          <Link href="/game">Try a Memory Round</Link>
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
                <CardDescription className="text-peach-400">
                  New and updated
                </CardDescription>
                <CardTitle className="text-2xl">More Guides to Read</CardTitle>
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
                        <h3 className="mt-1 text-lg font-semibold">
                          {page.title}
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-text-secondary">
                          {page.painPoint}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 shrink-0 text-peach-500" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="border-peach-500/20 bg-gradient-to-b from-peach-500/10 to-transparent">
              <CardHeader>
                <CardDescription className="text-peach-400">
                  Try what you learn
                </CardDescription>
                <CardTitle className="text-2xl">
                  Turn Reading into Practice
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <p className="text-sm leading-7 text-text-secondary">
                  After you read a guide, play one short round while the idea is
                  still fresh. Use your result to choose what to practice next.
                </p>
                <Button
                  asChild
                  className="w-full bg-peach-500 text-white hover:bg-peach-600"
                >
                  <Link href="/game">Start a Memory Round</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-bg-light bg-bg-card">
              <CardHeader>
                <CardDescription className="text-peach-400">
                  Need some help?
                </CardDescription>
                <CardTitle className="text-2xl">Pick Your Next Step</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 text-sm leading-7 text-text-secondary">
                <p className="inline-flex items-start gap-3">
                  <TrendingUp className="mt-1 h-4 w-4 shrink-0 text-peach-500" />
                  New to chess? Start with the beginner guide and build a simple
                  practice plan.
                </p>
                <p className="inline-flex items-start gap-3">
                  <Target className="mt-1 h-4 w-4 shrink-0 text-peach-500" />
                  Losing track of pieces? Choose a board vision, memory, or
                  visualization guide.
                </p>
                <p className="inline-flex items-start gap-3">
                  <Sparkles className="mt-1 h-4 w-4 shrink-0 text-peach-500" />
                  Short on time? Try the 20-minute study plan and keep the
                  routine easy to repeat.
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
