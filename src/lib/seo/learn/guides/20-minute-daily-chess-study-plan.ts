import type { LearnGuide } from "../schema";

const guide: LearnGuide = {
  slug: "20-minute-daily-chess-study-plan",
  goal: "routine",
  title: "20-Minute Daily Chess Study Plan for Beginners",
  h1: "A 20-minute daily chess study plan for beginners",
  description: "Follow a simple 20-minute plan with board practice, memory drills, play, and a quick review.",
  primaryKeyword: "20 minute daily chess study plan",
  secondaryKeywords: [
    "daily chess routine for beginners",
    "short chess study plan",
    "20 minute chess improvement",
    "beginner chess schedule",
    "chess routine with puzzles and review",
  ],
  ctaLabel: "Start the 20-Minute Plan",
  quickAnswer: "Spend a few minutes on board vision, memory, tactics, and review. Keep the routine short enough to do even when you are tired.",
  keyTakeaways: [
    "Practising often matters more than practising for a long time.",
    "Use both drills and real positions.",
    "A quick review helps tomorrow’s practice.",
  ],
  whoThisIsFor: [
    "Beginners with limited time but regular motivation.",
    "Players who stop following plans that are too demanding.",
    "Anyone who wants a daily routine they can repeat.",
  ],
  timeToRead: "7 min read",
  difficulty: "Beginner",
  publishedAt: "2026-03-06T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
  sections: [
    {
      id: "what-changes",
      title: "What improves first",
      eyebrow: "Consistency",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Many study plans only work when you have lots of free time. A useful plan should also work on a busy day.",
            "This 20-minute routine keeps one drill, one real position, and one quick review.",
          ],
        },
      ],
    },
    {
      id: "start-here",
      title: "Your 20-minute chess routine",
      summary: "You can try these steps today.",
      blocks: [
        {
          kind: "steps",
          ordered: true,
          items: [
            "Spend 4 minutes on a board-vision or recall drill.",
            "Spend 6 minutes on one Memory Chess sequence with the same settings for a full week.",
            "Spend 6 minutes on tactics or one position from a real game.",
            "Spend 4 minutes writing what failed or held up today.",
            "Keep the structure fixed for at least 7 days before adjusting it.",
          ],
        },
      ],
    },
    {
      id: "drills",
      title: "Drills that fit inside a short daily plan",
      summary: "A drill with a play link opens that exact round in Memory Chess. The rest you do away from the game.",
      blocks: [
        {
          kind: "drills",
          drills: [
            {
              title: "Warm-up recall",
              description: "Open every session with one round of 6 pieces and 10 seconds to look.",
              duration: "6 minutes",
              goal: "Start every session with the same board-memory warm-up.",
              ctaLabel: "Play 6 pieces, 10 seconds",
              setup: {
                pieceCount: 6,
                memorizeTime: 10,
              },
            },
            {
              title: "Threat check sprint",
              description: "Scan one position for checks, captures, threats, and loose pieces.",
              duration: "4 minutes",
              goal: "Improve transfer into real games without adding much time.",
              ctaLabel: "Run a threat check",
            },
            {
              title: "Review note loop",
              description: "Write one sentence about the type of mistake you made today.",
              duration: "4 minutes",
              goal: "Use today’s lesson to guide tomorrow’s practice.",
              ctaLabel: "Log one lesson",
            },
          ],
        },
      ],
    },
    {
      id: "comparison",
      title: "A routine you can keep using",
      summary: "The best routine is one you can repeat during a normal week.",
      blocks: [
        {
          kind: "comparison",
          columns: [
            "Situation",
            "Before practice",
            "After practice",
          ],
          rows: [
            {
              label: "Daily load",
              struggling: "You attempt too many study modes at once.",
              stronger: "You repeat a compact loop that covers the basics every day.",
            },
            {
              label: "Transfer",
              struggling: "You only watch or read and do not practise.",
              stronger: "Every session includes practice you can use in games.",
            },
            {
              label: "Review",
              struggling: "Mistakes disappear because there is no log.",
              stronger: "Each day ends with one note for tomorrow.",
            },
          ],
        },
      ],
    },
    {
      id: "mistakes",
      title: "Common mistakes to avoid",
      blocks: [
        {
          kind: "steps",
          ordered: false,
          items: [
            "Copying advanced study schedules that are impossible to sustain.",
            "Using all 20 minutes on passive content.",
            "Changing the routine every two days.",
            "Skipping the review step because it feels small.",
          ],
        },
        {
          kind: "callout",
          title: "What to do instead",
          body: "Do not make the plan bigger. Make it easy enough to repeat.",
        },
      ],
    },
    {
      id: "plan",
      title: "7-day 20-minute routine",
      summary: "Follow these steps before making the practice harder or longer.",
      blocks: [
        {
          kind: "plan",
          steps: [
            {
              label: "Day 1 to 3",
              duration: "20 minutes",
              detail: "Keep the same Memory Chess settings and threat-check format to build consistency.",
            },
            {
              label: "Day 4",
              duration: "20 minutes",
              detail: "Review your notes and keep only one correction point for the next three days.",
            },
            {
              label: "Day 5 to 6",
              duration: "20 minutes",
              detail: "Repeat the exact structure without adding content variety.",
            },
            {
              label: "Day 7",
              duration: "20 minutes",
              detail: "Check whether blunders or recall accuracy improved, then make only one adjustment for the next week.",
            },
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: "Is 20 minutes of chess study enough?",
      answer: "Yes, if it is consistent and includes drills that transfer directly into games rather than passive study alone.",
    },
    {
      question: "Should I use all 20 minutes on tactics?",
      answer: "Usually no. A blend of board clarity, tactical transfer, and short review works better for beginners.",
    },
    {
      question: "How long should I keep the same plan?",
      answer: "At least one week. Constantly changing the routine makes progress impossible to read.",
    },
    {
      question: "What should I track?",
      answer: "Track blunders per game, recall accuracy, and the type of mistake you make most often.",
    },
  ],
  relatedArticles: [
    {
      slug: "how-to-get-better-at-chess-for-beginners",
      reason: "See how this short routine fits into a longer beginner plan.",
    },
    {
      slug: "why-puzzle-rating-doesnt-transfer-to-games",
      reason: "Balance tactical work with board-clarity work.",
    },
    {
      slug: "how-to-analyze-chess-games-for-beginners",
      reason: "Keep the review block simple and productive.",
    },
  ],
  sources: [
    {
      title: "Distributed Practice in Verbal Recall Tasks",
      url: "https://doi.org/10.1037/0033-2909.132.3.354",
    },
    {
      title: "Test-Enhanced Learning: Taking Memory Tests Improves Retention",
      url: "https://doi.org/10.1111/j.1467-9280.2006.01693.x",
    },
  ],
};

export default guide;
