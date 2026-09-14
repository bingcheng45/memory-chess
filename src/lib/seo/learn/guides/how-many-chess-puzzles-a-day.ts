import type { LearnGuide } from "../schema";

const guide: LearnGuide = {
  slug: "how-many-chess-puzzles-a-day",
  goal: "routine",
  title: "How Many Chess Puzzles a Day Should Beginners Do?",
  h1: "How many chess puzzles should beginners do each day?",
  description: "Choose a daily puzzle amount that improves tactics while leaving time for memory, games, and review.",
  primaryKeyword: "how many chess puzzles a day",
  secondaryKeywords: [
    "daily puzzle count chess",
    "beginner chess puzzle routine",
    "how many tactics per day chess",
    "puzzle overload chess",
    "tactics volume beginners",
  ],
  ctaLabel: "Balance Puzzles and Practice",
  quickAnswer: "A short daily puzzle session is enough for most beginners. Stop while you are still thinking clearly and leave time for games, memory, and review.",
  keyTakeaways: [
    "Puzzle quality matters more than puzzle count.",
    "Too many puzzles can take time away from real games and review.",
    "Your ideal count should still leave time for games or game review.",
  ],
  whoThisIsFor: [
    "Players who use puzzles as their entire study plan.",
    "Beginners who want a clear puzzle routine.",
    "Anyone trying to balance puzzles with real-game practice.",
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
            "There is no perfect number for everyone. Too few puzzles may slow pattern learning, while too many leave no time for other useful practice.",
            "Do enough puzzles to stay sharp, then spend time on board memory, games, and review.",
          ],
        },
      ],
    },
    {
      id: "start-here",
      title: "Choose a useful daily puzzle amount",
      summary: "You can try these steps today.",
      blocks: [
        {
          kind: "steps",
          ordered: true,
          items: [
            "Decide whether puzzles are your warm-up, main study block, or transfer check.",
            "Keep one short Memory Chess round before or after puzzles to maintain board clarity.",
            "Stop when your puzzle answers become rushed instead of chasing a larger number.",
            "Review one missed tactical moment from a real game each day.",
            "Change the number of puzzles only after checking whether your game mistakes are changing.",
          ],
        },
      ],
    },
    {
      id: "drills",
      title: "Drills that make puzzles more useful",
      summary: "A drill with a play link opens that exact round in Memory Chess. The rest you do away from the game.",
      blocks: [
        {
          kind: "drills",
          drills: [
            {
              title: "Puzzle warm-up plus recall",
              description: "Play one round of 6 pieces with 10 seconds to look, then start a modest puzzle block.",
              duration: "10 minutes",
              goal: "Connect puzzle practice to real play.",
              ctaLabel: "Play 6 pieces, 10 seconds",
              setup: {
                pieceCount: 6,
                memorizeTime: 10,
              },
            },
            {
              title: "Signal check after each puzzle",
              description: "Ask what warning sign made the tactic possible before reviewing the answer.",
              duration: "5 minutes",
              goal: "Notice why a position has a tactic.",
              ctaLabel: "Check the signal",
            },
            {
              title: "Game puzzle replay",
              description: "Turn one missed game tactic into a puzzle you solve after rebuilding the board.",
              duration: "5 minutes",
              goal: "Use tactics from your own games.",
              ctaLabel: "Replay a game tactic",
            },
          ],
        },
      ],
    },
    {
      id: "comparison",
      title: "Too few puzzles, too many puzzles, and enough puzzles",
      summary: "The right amount keeps your tactics sharp and still leaves time for games.",
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
              label: "Pattern recognition",
              struggling: "Too little practice makes common tactics feel unfamiliar.",
              stronger: "A moderate daily block keeps patterns fresh.",
            },
            {
              label: "Transfer",
              struggling: "Too many puzzles leave no time for board vision or review.",
              stronger: "Your routine still includes recall and game-context work.",
            },
            {
              label: "Fatigue",
              struggling: "Late puzzles become rushed guesses.",
              stronger: "You stop while decisions are still clean.",
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
            "Using puzzle count as the only measure of study quality.",
            "Doing tactics without any transfer into games.",
            "Continuing puzzles long after focus drops.",
            "Crowding out review and board-vision work.",
          ],
        },
        {
          kind: "callout",
          title: "What to do instead",
          body: "More puzzles are not always better. Check whether they are helping your real games.",
        },
      ],
    },
    {
      id: "plan",
      title: "7-day puzzle balance plan",
      summary: "Follow these steps before making the practice harder or longer.",
      blocks: [
        {
          kind: "plan",
          steps: [
            {
              label: "Day 1 to 2",
              duration: "15 minutes",
              detail: "Use a small puzzle block and add one short recall drill before it.",
            },
            {
              label: "Day 3 to 4",
              duration: "15 minutes",
              detail: "Add a signal check after each puzzle to notice why the tactic existed.",
            },
            {
              label: "Day 5",
              duration: "15 minutes",
              detail: "Replay one missed game tactic and compare it with your puzzle performance.",
            },
            {
              label: "Day 6 to 7",
              duration: "15 to 20 minutes",
              detail: "Change the puzzle amount only if your answers stay careful and you still have time for games.",
            },
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: "How many chess puzzles a day is enough for beginners?",
      answer: "Do enough to keep common tactics familiar while leaving time for memory practice and games. A short daily session is enough for many beginners.",
    },
    {
      question: "Can too many puzzles hurt improvement?",
      answer: "Indirectly, yes. They can crowd out the board vision, recall, and game review work needed for real transfer.",
    },
    {
      question: "Should I do puzzles before or after games?",
      answer: "Either can work, but a small warm-up plus one transfer step after games often works well.",
    },
    {
      question: "What should I track?",
      answer: "Track whether game blunders and missed simple tactics are dropping, not only how many puzzles you completed.",
    },
  ],
  relatedArticles: [
    {
      slug: "why-puzzle-rating-doesnt-transfer-to-games",
      reason: "Understand why puzzle success alone is not enough.",
    },
    {
      slug: "20-minute-daily-chess-study-plan",
      reason: "Fit puzzles into a balanced short routine.",
    },
    {
      slug: "chess-pattern-recognition-drills",
      reason: "Learn common patterns instead of only increasing the number of puzzles.",
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
