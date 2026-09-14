import type { LearnGuide } from "../schema";

const guide: LearnGuide = {
  slug: "chess-board-vision-drills",
  goal: "reduce-blunders",
  title: "Chess Board Vision Drills to Cut Blunders",
  h1: "Chess board vision drills for beginners",
  description: "Use simple board vision drills to spot threats, protect your pieces, and make fewer blunders.",
  primaryKeyword: "chess board vision",
  secondaryKeywords: [
    "chess board vision drills",
    "reduce chess blunders",
    "spot threats in chess",
    "chess tactical awareness",
    "beginner chess mistakes",
  ],
  ctaLabel: "Start a Board Vision Drill",
  quickAnswer: "Before every move, look for checks, captures, threats, and unprotected pieces. Memory practice helps you keep every piece in mind while you scan.",
  keyTakeaways: [
    "Board vision is a habit you can learn.",
    "Loose-piece awareness is often the fastest beginner fix.",
    "Memory practice helps you keep track of the whole board.",
  ],
  whoThisIsFor: [
    "Players who still hang pieces despite knowing basic tactics.",
    "Beginners who play quickly and realize the blunder only after the capture.",
    "Anyone who needs a clear checklist before each move.",
  ],
  timeToRead: "8 min read",
  difficulty: "Beginner",
  featured: true,
  publishedAt: "2026-03-06T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
  sections: [
    {
      id: "what-changes",
      title: "What improves first",
      eyebrow: "Threat checks",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "When a player says, “I did not see it,” they often moved before checking the whole board.",
            "Board vision drills teach you where to look. Start with unprotected pieces and moves that give check, capture, or create a threat.",
          ],
        },
      ],
    },
    {
      id: "start-here",
      title: "Start here: the pre-move board vision loop",
      summary: "You can try these steps today.",
      blocks: [
        {
          kind: "steps",
          ordered: true,
          items: [
            "Name checks, captures, and threats for both sides before every move.",
            "Mark every undefended piece and say whether it is truly safe or only looks safe.",
            "Run one short Memory Chess round to tighten square-to-piece recall.",
            "Review one recent blunder and identify the exact missed threat.",
            "Repeat the same checklist in your next rapid game without shortening it.",
          ],
        },
      ],
    },
    {
      id: "drills",
      title: "Board vision drills for real games",
      summary: "A drill with a play link opens that exact round in Memory Chess. The rest you do away from the game.",
      blocks: [
        {
          kind: "drills",
          drills: [
            {
              title: "Loose-piece inventory",
              description: "Scan the board and identify every undefended piece before moving.",
              duration: "3 minutes",
              goal: "Catch the most common beginner blunder source early.",
              ctaLabel: "Run loose-piece training",
            },
            {
              title: "Threat replay",
              description: "Recreate your last blunder position and find the opponent’s strongest threat before checking the game.",
              duration: "5 minutes",
              goal: "Teach the brain what a missed threat looked like in context.",
              ctaLabel: "Replay a threat",
            },
            {
              title: "Fast-square recall",
              description: "Play 6 pieces with only 4 seconds to look. The board has to stay intact in your head while you scan it.",
              duration: "4 minutes",
              goal: "Remember piece locations while you scan the board.",
              ctaLabel: "Play 6 pieces, 4 seconds",
              setup: {
                pieceCount: 6,
                memorizeTime: 4,
              },
            },
          ],
        },
      ],
    },
    {
      id: "comparison",
      title: "Weak board vision vs stronger board vision",
      summary: "The difference is usually visible before calculation even begins.",
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
              label: "Attention",
              struggling: "You stare at one tactical idea.",
              stronger: "You scan the whole board before selecting a plan.",
            },
            {
              label: "Safety checks",
              struggling: "You assume a defended piece is safe.",
              stronger: "You count attackers and defenders before trusting the square.",
            },
            {
              label: "Time pressure",
              struggling: "You move faster as the position gets sharper.",
              stronger: "You slow down when checks, captures, or threats appear.",
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
            "Checking only your own idea and ignoring the opponent’s threats.",
            "Assuming a defended piece is safe without counting the full tactical sequence.",
            "Playing too fast once the position becomes tactical.",
            "Never naming the type of mistake after a game.",
          ],
        },
        {
          kind: "callout",
          title: "What to do instead",
          body: "More puzzles will not fix a rushed board scan. Practise the same short check before every move.",
        },
      ],
    },
    {
      id: "plan",
      title: "7-day board vision reset",
      summary: "Follow these steps before making the practice harder or longer.",
      blocks: [
        {
          kind: "plan",
          steps: [
            {
              label: "Day 1 to 2",
              duration: "12 minutes",
              detail: "Use only loose-piece inventory and checks-captures-threats scanning.",
            },
            {
              label: "Day 3 to 4",
              duration: "15 minutes",
              detail: "Add one Memory Chess round before your games so the scan happens on a cleaner mental board.",
            },
            {
              label: "Day 5",
              duration: "15 minutes",
              detail: "Review three recent blunders and label the missed signal in each position.",
            },
            {
              label: "Day 6 to 7",
              duration: "15 to 20 minutes",
              detail: "Play rapid and use the full checklist on every move that changes tension or king safety.",
            },
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: "What is the quickest way to improve chess board vision?",
      answer: "Use the same pre-move checklist in every game until it becomes automatic: checks, captures, threats, and loose pieces.",
    },
    {
      question: "Why do I blunder even when I know tactics?",
      answer: "Because the board-tracking layer is weak. Tactics only help after you notice the position correctly.",
    },
    {
      question: "How often should I review my blunders?",
      answer: "After every game. A short review habit creates much faster transfer than a weekly review binge.",
    },
    {
      question: "Can memory drills help board vision?",
      answer: "Yes. Faster piece recall makes it easier to keep the whole board active in attention while scanning.",
    },
  ],
  relatedArticles: [
    {
      slug: "how-to-stop-blundering-in-chess",
      reason: "Use the full anti-blunder guide when vision errors are costing material.",
    },
    {
      slug: "why-puzzle-rating-doesnt-transfer-to-games",
      reason: "Understand why tactics skill often fails under live board pressure.",
    },
    {
      slug: "how-to-get-better-at-chess-for-beginners",
      reason: "See how board vision fits inside a full beginner routine.",
    },
  ],
  sources: [
    {
      title: "Recognition and Look-Ahead Search in Time-Constrained Expert Chess",
      url: "https://doi.org/10.1111/j.1467-9280.1996.tb00666.x",
    },
    {
      title: "Templates in Chess Memory: A Mechanism for Recalling Several Boards",
      url: "https://doi.org/10.1006/cogp.1996.0011",
    },
    {
      title: "How to Never Blunder at Chess Again",
      url: "https://www.chess.com/blog/The_ChessicalPlayer/how-to-never-blunder-at-chess-again",
      note: "A useful example of common advice about avoiding blunders.",
    },
  ],
};

export default guide;
