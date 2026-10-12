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
  ctaTag: { article: "Article", stat: "Dashboard" },
} as const;

export const LEARN_HUB_COPY = {
  meta: {
    title: "Learn Chess One Clear Step at a Time",
    description:
      "Practical beginner chess guides for board vision, visualization, memory, calculation, blunder prevention, and daily practice.",
  },
  kicker: "Learn",
  title: "Learn chess one clear step at a time",
  lede: "Short guides grouped by what you want to fix. Each one explains one idea in plain language and ends with a round to play.",
  guideCount: (count: number) => `${count} ${count === 1 ? "guide" : "guides"}`,
};
