import type { LearnDocument } from "../schema";

const guide: LearnDocument = {
  meta: {
    slug: "how-many-chess-puzzles-a-day",
    title: "How Many Chess Puzzles a Day Should Beginners Do?",
    h1: "How many chess puzzles a day should a beginner do?",
    description: "Do 10 to 15 chess puzzles a day, about one a minute in a 10- to 15-minute block. Stop sooner once you start playing moves just to see whether they work.",
    group: "practice",
    level: "beginner",
    publishedAt: "2026-03-24T00:00:00.000Z",
    updatedAt: "2026-10-20T00:00:00.000Z",
    questions: [
      "How many chess puzzles should I do a day?",
      "Is one puzzle a day enough?",
      "Should I do puzzles before or after games?",
      "Are themed or mixed puzzles better?",
    ],
    keywords: {
      primary: "how many chess puzzles a day",
      secondary: [
        "daily puzzle count chess",
        "beginner chess puzzle routine",
        "how many tactics per day chess",
        "puzzle overload chess",
        "tactics volume beginners",
      ],
    },
  },
  intro: {
    quickAnswer: "Your daily count is your study minutes at one checked puzzle a minute, so a 10-minute block is about ten puzzles. Before each move, look for the opponent's reply that would refute it. Fifty puzzles in twenty minutes leaves no time for that check.",
    takeaways: [
      "Your daily count is your minutes at one checked puzzle a minute.",
      "Treat the count as a ceiling. Stop earlier when you start guessing moves.",
      "Three 6-piece memory rounds before and after the block show whether it ran too long.",
    ],
    audience: [
      "You do puzzles every day and want a count you can defend.",
      "Your sessions start sharp and end in guesses.",
      "You are choosing between puzzles and a game on a short evening.",
    ],
  },
  sections: [
    {
      id: "minutes-first",
      heading: "Work out your daily puzzle count from your minutes",
      blocks: [
        {
          kind: "prose",
          paragraphs: ["A checked puzzle has three steps."],
        },
        {
          kind: "list",
          ordered: true,
          items: [
            "Find a move.",
            "Look for the opponent's reply that would refute it.",
            "Confirm that reply is not there, then play the move.",
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "Give each checked puzzle about a minute. Then the count is arithmetic. A 10-minute block is about ten puzzles and a 15-minute block about fifteen.",
            "Fifty puzzles in twenty minutes is under half a minute each. That leaves no time for the reply check, so you are practising speed on patterns you already know.",
          ],
        },
      ],
    },
    {
      id: "cap-not-target",
      heading: "Why your puzzle count is a ceiling",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "The puzzles that teach you most are the ones where your first move fails the check. You had a move, you looked for the reply, and the reply was there.",
            "A puzzle you solve at a glance only confirms a pattern you already had. Those are fine to meet, but the minutes are for the ones that catch you.",
            "So stop at the count your minutes allow, and stop earlier once you play a move without checking the reply.",
          ],
        },
      ],
    },
    {
      id: "session-types",
      heading: "Three kinds of puzzle session and a count for each",
      blocks: [
        {
          kind: "table",
          columns: ["Session", "Minutes and count", "What the puzzles are for"],
          rows: [
            {
              label: "Before a game",
              cells: [
                "About 5 minutes, 3 to 5 easy puzzles",
                "Getting your eyes onto a board. Easy ones, solved to the end, no clock.",
              ],
            },
            {
              label: "Main study block",
              cells: [
                "10 to 15 minutes, one puzzle a minute",
                "Learning patterns. Themed puzzles while a pattern is new, mixed once you can name it on sight. Check the reply before every move.",
              ],
            },
            {
              label: "After a lost game",
              cells: [
                "About 5 minutes, 1 puzzle",
                "The tactic you missed, set up from your own game and solved from your side of the board.",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "too-many",
      heading: "Four signs your count is too high",
      blocks: [
        {
          kind: "list",
          ordered: false,
          items: [
            "You play the most forcing move first and read the result to learn whether it worked.",
            "The last five puzzles of a session go worse than the first five, most days.",
            "You cannot say, for yesterday's puzzles, which pattern any of them was.",
            "The recall check below comes out at least two pieces lower after the block than before it.",
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "Any one of these means the block runs too long. Keep the difficulty and the minute per puzzle, and take five minutes off the block. Then watch whether the last five puzzles improve.",
          ],
        },
      ],
    },
    {
      id: "recall-check",
      heading: "A recall check before and after the block",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Memory Chess gives you a quick way to see whether the block wore you out. Play three rounds of 6 pieces with 10 seconds to look, before your puzzles and again after.",
            "Write down how many pieces you placed correctly. Three rounds give you 18 pieces to place, so each total is a number out of 18.",
            "A single round is too coarse for this. At 6 pieces, one missed piece turns a Perfect Score into Great Job at 83 percent, and a second miss gives Good Effort at 67 percent.",
            "The check does not measure puzzle skill. It shows whether you can still take in a whole board after the block, which the last puzzles needed too.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Three rounds on each side of the block",
              description: "Play 6 pieces with 10 seconds to look, 3 rounds before your puzzles and 3 rounds after. Write down correct pieces out of 18 each time.",
              duration: "about 3 minutes before and 3 after",
              goal: "The total after the block within one piece of the total before it.",
              play: { label: "Play 6 pieces, 10 seconds", pieceCount: 6, memorizeTime: 10 },
            },
          ],
        },
      ],
    },
    {
      id: "when-to-raise",
      heading: "When to add minutes to the block",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Add minutes only when two things hold. Your games have stopped losing to patterns you already solve, and the recall check stays level after the block.",
            "Add five minutes at a time. Hold the new length for two weeks before judging it, and go back if the after-block total starts dropping.",
          ],
        },
      ],
    },
  ],
  end: [
    {
      kind: "cta",
      target: { kind: "game", label: "Play 6 pieces, 10 seconds", pieceCount: 6, memorizeTime: 10 },
      why: "Play three rounds before your puzzles and three after. If the second total is two or more pieces lower out of 18, cut five minutes from tomorrow's block.",
    },
    {
      kind: "faq",
      items: [
        {
          question: "Is one puzzle a day worth anything?",
          answer: "Yes, if it is the position from your own game where you missed a tactic. Set up the position where the tactic was there to play and solve it from your side of the board. It is the one puzzle certain to be about your games.",
        },
        {
          question: "Puzzles before or after games?",
          answer: "Before a game, solve three to five easy puzzles in about five minutes to get your eyes onto a board. Keep the main block apart from your games. Straight after a loss, solve only the tactic you missed and save the full block for a calmer moment.",
        },
        {
          question: "Should the puzzles be themed or mixed?",
          answer: "Themed while a pattern is new, so you meet it several times in a row. Mixed once you can name it on sight, so it hides among others the way it does in a game.",
        },
        {
          question: "What if I enjoy doing fifty?",
          answer: "Then do fifty and treat them as play. Do the checked block first while you are fresh, and count only those puzzles as study. Fast solving skips the reply check, so it cannot replace the slow block.",
        },
      ],
    },
    {
      kind: "furtherReading",
      items: [
        {
          kind: "guide",
          slug: "why-puzzle-rating-doesnt-transfer-to-games",
          reason: "Why puzzle skill can sit unused in your games, whatever the count.",
        },
        {
          kind: "guide",
          slug: "20-minute-daily-chess-study-plan",
          reason: "Where a six-puzzle block sits inside a full short session.",
        },
        {
          kind: "guide",
          slug: "how-to-analyze-chess-games-for-beginners",
          reason: "How to find the missed tactic that becomes your one puzzle after a loss.",
        },
        {
          kind: "guide",
          slug: "chess-pattern-recognition-drills",
          reason: "What to do with a pattern once you can name it.",
        },
      ],
    },
  ],
};

export default guide;
