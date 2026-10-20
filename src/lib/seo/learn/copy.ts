/**
 * Chrome for the Learn hub and guides. Learn is English-only (see ENGLISH_ONLY_ROUTES), so this copy lives here
 * instead of in 24 catalogues. Every guide repeats these strings, so each stays under five words (seo.md, the
 * AdSense repeated-sentence rule) and renders as a label, never as an h2.
 */
export const LEARN_GUIDE_COPY = {
  breadcrumbHome: "Home",
  breadcrumbLearn: "Learn",
  quickAnswer: "Quick answer",
  takeaways: "Takeaways",
  audience: "Who this is for",
  contents: "On this page",
  allGuides: "All guides",
  aimFor: "Aim for:",
  atABoard: "At a real board",
  readNext: "Read next",
  sources: "Sources",
  minRead: (minutes: number) => `${minutes} min read`,
  updated: (date: string) => `Updated ${date}`,
  by: "By",
  figure: (n: number) => `Fig. ${n}`,
  toMove: (side: "w" | "b") => (side === "w" ? "White to move." : "Black to move."),
  pieces: (count: number) => `${count} pieces`,
  secondsToLook: (seconds: number) => `${seconds} s to look`,
  ctaAction: { game: "Play", article: "Read", stat: "Open" },
  quickPlay: "Try a round now",
  tryRound: (pieces: number, seconds: number) => `Try ${pieces} pieces, ${seconds} seconds`,
  dailyBoard: "Play today's daily board",
  ctaTag: { article: "Article", stat: "Dashboard" },
} as const;

const COUNT_WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
const countWord = (n: number) => COUNT_WORDS[n] ?? String(n);

export const LEARN_HUB_COPY = {
  meta: {
    title: "Learn Chess One Clear Step at a Time",
    description:
      "Practical beginner chess guides for board vision, visualization, memory, calculation, blunder prevention, and daily practice.",
  },
  kicker: "Learn",
  title: "A path from your first game to a daily routine",
  lede: (stages: number) =>
    `${countWord(stages)} stages, each a few short guides. Read them in order, or start at the stage that matches your problem.`,
  stageMap: "Stages",
  stageOf: (n: number, total: number) => `Stage ${n} of ${total}`,
  guideCount: (count: number) => `${count} ${count === 1 ? "guide" : "guides"}`,
  endsWith: ({ pieceCount, memorizeTime }: { pieceCount: number; memorizeTime: number }) =>
    `ends with ${pieceCount} pieces, ${memorizeTime} seconds`,
  closing: {
    title: "Then keep the routine going",
    body: "Play a round most days, and read how strong players and researchers describe the same skill.",
    play: "Play a 6-piece round",
    articles: "Read the articles",
    stat: "Count your days played on the dashboard",
    data: "See how well other players recall positions, by piece count and study time",
  },
};

export const LEARN_SEARCH_COPY = {
  label: "Ask a question",
  placeholder: "e.g. why do I keep hanging pieces",
  submit: "Search",
  peopleAsk: "People ask",
  results: "Results",
  closest: "Closest guides",
  answers: "Answers:",
  article: "Article",
  matches: (count: number) => (count === 0 ? "No guide matches" : `${count} ${count === 1 ? "guide matches" : "guides match"}`),
  none: (query: string) => `No guide answers "${query}" yet.`,
  noneHint: "Browse a stage, or play a round while the guide is written.",
  playRound: "Play a 6-piece round",
  serverTitle: "Search the Learn guides",
  serverLede: "Type a question the way you would ask it. The guides that answer it come first.",
  serverResults: (query: string) => `Guides for "${query}"`,
  stages: "Stages",
};
