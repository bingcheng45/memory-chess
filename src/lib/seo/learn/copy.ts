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
  alsoIn: "Also in",
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
