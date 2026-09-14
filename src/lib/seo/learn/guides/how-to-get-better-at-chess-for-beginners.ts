import type { LearnGuide } from "../schema";

const guide: LearnGuide = {
  slug: "how-to-get-better-at-chess-for-beginners",
  goal: "routine",
  title: "How to Get Better at Chess for Beginners",
  h1: "How to get better at chess for beginners",
  description: "Follow a simple beginner chess plan to see the board better, remember positions, and make safer moves.",
  primaryKeyword: "how to get better at chess",
  secondaryKeywords: [
    "chess improvement plan",
    "beginner chess training",
    "chess routine for beginners",
    "reduce blunders in chess",
    "chess board vision",
  ],
  ctaLabel: "Start a Beginner Round",
  quickAnswer: "Use a short daily routine: practise board vision, train your memory, play a game, and review one mistake. Repeat it for 20 to 30 minutes a day.",
  keyTakeaways: [
    "Seeing and remembering the board matters more than memorising many openings.",
    "Short daily practice works better than rare, long sessions.",
    "Track your mistakes and recall score, not only your rating.",
  ],
  whoThisIsFor: [
    "Players who know the rules but still hang pieces.",
    "Beginners who do well at puzzles but struggle in games.",
    "Anyone who does not know what to study first.",
  ],
  timeToRead: "9 min read",
  difficulty: "Beginner",
  featured: true,
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
            "Most beginners do not need more openings, videos, or courses. They need to keep track of the board and check that a move is safe before playing it.",
            "Memory Chess helps you practise both skills. Better board recall makes checks, captures, and threats easier to spot.",
          ],
        },
      ],
    },
    {
      id: "start-here",
      title: "Start with this beginner routine",
      summary: "You can try these steps today.",
      blocks: [
        {
          kind: "steps",
          ordered: true,
          items: [
            "Spend 3 minutes scanning a board and naming attacked, defended, and hanging pieces.",
            "Run one Memory Chess round with 8 pieces and a 10-second viewing window.",
            "Play two short tactical positions and speak checks, captures, and threats before choosing a move.",
            "Play one rapid game. Mark each big mistake as vision, memory, or time trouble.",
            "Write down one thing to practise again tomorrow.",
          ],
        },
      ],
    },
    {
      id: "drills",
      title: "Simple drills for better games",
      summary: "A drill with a play link opens that exact round in Memory Chess. The rest you do away from the game.",
      blocks: [
        {
          kind: "drills",
          drills: [
            {
              title: "10-second board scan",
              description: "Play 4 pieces with 10 seconds to look. While the position is up, say which pieces are unprotected, then rebuild the board.",
              duration: "3 minutes",
              goal: "A full rebuild, with the loose pieces named out loud.",
              ctaLabel: "Play 4 pieces, 10 seconds",
              setup: {
                pieceCount: 4,
                memorizeTime: 10,
              },
            },
            {
              title: "Repeat-the-same-settings recall",
              description: "Play 8 pieces with 10 seconds to look, twice in a row. The result screen shows the original beside your board, so you can see the exact piece you dropped.",
              duration: "5 minutes",
              goal: "Find the exact piece or square you forgot.",
              ctaLabel: "Play 8 pieces, 10 seconds",
              setup: {
                pieceCount: 8,
                memorizeTime: 10,
              },
            },
            {
              title: "Game-to-drill transfer block",
              description: "After a rapid game, picture the position where you made a mistake before you review it.",
              duration: "7 minutes",
              goal: "Use your real mistakes to guide your practice.",
              ctaLabel: "Start transfer practice",
            },
          ],
        },
      ],
    },
    {
      id: "comparison",
      title: "What better beginner play looks like",
      summary: "You do not need to see five moves ahead. Start by seeing the current board clearly and taking a moment before you move.",
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
              label: "Before moving",
              struggling: "You look only at your idea.",
              stronger: "You check your opponent’s threats first.",
            },
            {
              label: "During tactics",
              struggling: "Your line disappears after one exchange.",
              stronger: "You can picture the key squares while comparing two possible moves.",
            },
            {
              label: "After losses",
              struggling: "You queue another game immediately.",
              stronger: "You name the mistake and practise it tomorrow.",
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
            "Jumping between random content instead of repeating one routine for two weeks.",
            "Studying openings before board vision is stable.",
            "Playing too many games without short post-game notes.",
            "Treating memory practice as separate from real chess.",
          ],
        },
        {
          kind: "callout",
          title: "What to do instead",
          body: "Do not rush into advanced study. Most beginners lose games by missing one-move threats, not by forgetting an opening line.",
        },
      ],
    },
    {
      id: "plan",
      title: "30-day beginner plan",
      summary: "Follow these steps before making the practice harder or longer.",
      blocks: [
        {
          kind: "plan",
          steps: [
            {
              label: "Week 1",
              duration: "20 minutes a day",
              detail: "Use the same board scan and play one short Memory Chess round before each game session.",
            },
            {
              label: "Week 2",
              duration: "25 minutes a day",
              detail: "Add a second recall round and log whether each game mistake was vision, recall, or panic.",
            },
            {
              label: "Week 3",
              duration: "25 to 30 minutes a day",
              detail: "Use the same drills but shorten memorization time so clean recall happens under pressure.",
            },
            {
              label: "Week 4",
              duration: "30 minutes a day",
              detail: "Review whether blunders per game are dropping and keep only the drill settings that transferred best.",
            },
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: "How many minutes should beginners train each day?",
      answer: "A focused 20 to 30 minutes is enough when you combine board vision, memory, and one real position.",
    },
    {
      question: "Why do my puzzle skills not transfer to games?",
      answer: "Puzzles begin after the tactic exists. Games require you to notice the board change first, so recall and safety checks matter much more.",
    },
    {
      question: "Should I memorize openings early?",
      answer: "Only basic principles at first. Most beginners gain more from seeing threats earlier and holding positions more clearly.",
    },
    {
      question: "What is the fastest metric to track progress?",
      answer: "Track blunders per game and Memory Chess recall accuracy. Those usually move before rating does.",
    },
  ],
  relatedArticles: [
    {
      slug: "how-to-stop-blundering-in-chess",
      reason: "Use this when your main problem is hanging pieces.",
    },
    {
      slug: "chess-board-vision-drills",
      reason: "Go deeper on the pre-move threat check habit.",
    },
    {
      slug: "chess-visualization-exercises",
      reason: "Build a stronger mental board so tactics hold together.",
    },
    {
      slug: "chess-memory-training",
      reason: "Train recall directly if you forget piece locations.",
    },
    {
      slug: "20-minute-daily-chess-study-plan",
      reason: "Follow a shorter routine if you need a simpler daily structure.",
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
    {
      title: "How to get better at chess? (r/chessbeginners)",
      url: "https://www.reddit.com/r/chessbeginners/comments/13u9tte/how_to_get_better_at_chess/",
      note: "Useful for identifying recurring beginner pain points around scattered study habits.",
    },
  ],
};

export default guide;
