// `scripts/articles-i18n.mjs` imports this file with Node's type stripping, so it holds data only.

const GUIDE_CHROME = {
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
  faq: "Questions",
  minRead: "{minutes} min read",
  updated: "Updated {date}",
  checked: "Checked {date}",
  by: "By",
  figure: "Fig. {n}",
  whiteToMove: "White to move.",
  blackToMove: "Black to move.",
  pieces: "{count, plural, one {# piece} other {# pieces}}",
  secondsToLook: "{seconds} s to look",
  ctaAction: { game: "Play", article: "Read", stat: "Open" },
  ctaTag: { article: "Article", stat: "Dashboard" },
  quickPlay: "Try a round now",
  tryRound: "Try {pieces, plural, one {# piece} other {# pieces}}, {seconds, plural, one {# second} other {# seconds}}",
  dailyBoard: "Play today's daily board",
  authorshipNote: "Written with AI assistance; chess positions checked by script and game facts traced to the code.",
  translationNote: "Translated from English with AI assistance and checked by a second AI, not yet by a native speaker.",
  readInEnglish: "Read it in English",
  levels: {
    beginner: "Beginner",
    improver: "Beginner to intermediate",
    intermediate: "Intermediate",
  },
  groups: {
    foundations: "Start here",
    "board-vision": "Board vision and blunders",
    visualization: "Visualization and calculation",
    memory: "Memory and patterns",
    practice: "Practice and review",
    science: "The science of chess memory",
    "using-memory-chess": "Using Memory Chess",
    compare: "Compare training tools",
  },
} as const;

export type GuideChrome = { readonly [K in keyof typeof GUIDE_CHROME]: (typeof GUIDE_CHROME)[K] extends string ? string : { readonly [L in keyof (typeof GUIDE_CHROME)[K]]: string } };

export default GUIDE_CHROME;
