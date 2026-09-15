import type { LearnGuide } from "../schema";

const guide: LearnGuide = {
  slug: "how-many-chess-puzzles-a-day",
  goal: "routine",
  title: "How Many Chess Puzzles a Day Should Beginners Do?",
  h1: "How many chess puzzles should beginners do each day?",
  description:
    "Set the minutes first and the count follows. How long a checked puzzle takes, a count for each kind of session, and a recall check that tells you the block ran too long.",
  primaryKeyword: "how many chess puzzles a day",
  secondaryKeywords: [
    "daily puzzle count chess",
    "beginner chess puzzle routine",
    "how many tactics per day chess",
    "puzzle overload chess",
    "tactics volume beginners",
  ],
  ctaLabel: "Play 6 pieces, 10 seconds",
  quickAnswer:
    "Choose the minutes first, then give each puzzle about a minute with the reply checked. Ten minutes is about ten puzzles and fifteen minutes about fifteen. Stop sooner once you start clicking instead of checking.",
  keyTakeaways: [
    "The count comes from your minutes divided by the pace of a checked puzzle.",
    "The count is a cap, not a target. Stop earlier when solving turns into clicking.",
    "Three 6-piece memory rounds before and after the block show whether it ran too long.",
  ],
  whoThisIsFor: [
    "You do puzzles every day and want a count you can defend.",
    "Your sessions start sharp and end in guesses.",
    "You are choosing between puzzles and a game on a short evening.",
  ],
  timeToRead: "7 min read",
  difficulty: "Beginner",
  publishedAt: "2026-03-06T00:00:00.000Z",
  updatedAt: "2026-09-15T00:00:00.000Z",
  sections: [
    {
      id: "minutes-first",
      title: "Start from minutes, not from a puzzle count",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "This guide gives no fixed daily number, because a useful count depends on your minutes. What you can control is how many minutes you have and how each puzzle is done.",
            "A checked puzzle has three parts. You find the move, you look for the reply that would refute it, and you confirm that reply is not there.",
            "Give that about a minute. Then the count is arithmetic. A 10-minute block is about ten puzzles and a 15-minute block about fifteen.",
            "Fifty puzzles in twenty minutes is under half a minute each. That leaves no time for the reply check, so it is a different activity with the same name.",
          ],
        },
      ],
    },
    {
      id: "cap-not-target",
      title: "Why the count works as a cap",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "The useful puzzles are the ones where your first move fails the check. You had a move, you looked for the reply, and the reply was there.",
            "A puzzle you solve at a glance only confirms a pattern you already had. It is fine to meet those, but they are not what the minutes are for.",
            "So stop at the count your minutes allow, and stop earlier the moment a puzzle gets clicked instead of checked.",
          ],
        },
      ],
    },
    {
      id: "session-types",
      title: "Three kinds of puzzle session and a count for each",
      blocks: [
        {
          kind: "comparison",
          columns: ["Session", "Minutes and count", "What the puzzles are for"],
          rows: [
            {
              label: "Before a game",
              struggling: "About 5 minutes, 3 to 5 easy puzzles",
              stronger: "Getting your eyes onto a board. Easy ones, solved to the end, no clock.",
            },
            {
              label: "Main study block",
              struggling: "10 to 15 minutes, one puzzle a minute",
              stronger: "Learning patterns. Mixed puzzles, the reply checked before every move.",
            },
            {
              label: "After a lost game",
              struggling: "About 5 minutes, 1 puzzle",
              stronger: "The tactic you missed, set up from your own game and solved from your side of the board.",
            },
          ],
        },
      ],
    },
    {
      id: "too-many",
      title: "Four signs your count is too high",
      blocks: [
        {
          kind: "steps",
          ordered: false,
          items: [
            "You play the most forcing move first and read the result to learn whether it worked.",
            "The last five puzzles of a session go worse than the first five, most days.",
            "You cannot say, for yesterday's puzzles, which pattern any of them was.",
            "The recall check below comes out at least two pieces lower after the block than before it.",
          ],
        },
        {
          kind: "paragraphs",
          paragraphs: [
            "Any one of these means cut the minutes, not the difficulty. Take five minutes off the block, keep the minute per puzzle, and watch whether the last five improve.",
          ],
        },
      ],
    },
    {
      id: "recall-check",
      title: "A recall check before and after the block",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Memory Chess gives you a quick way to see whether the block wore you out. Play three rounds of 6 pieces with 10 seconds to look, before puzzles and again after.",
            "Count pieces, not result messages. Three rounds give you 18 pieces to place, so each total is a number out of 18.",
            "A single round is too coarse for this. At 6 pieces, one missed piece turns a Perfect Score into Great Job at 83 percent, and a second miss gives Good Effort at 67 percent.",
            "The check does not measure puzzle skill. It shows whether you can still take in a whole board after the block, which the last puzzles needed too.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Three rounds on each side of the block",
              description:
                "Play 6 pieces with 10 seconds to look, 3 rounds before your puzzles and 3 rounds after. Write down correct pieces out of 18 each time.",
              duration: "about 3 minutes before and 3 after",
              goal: "The total after the block within one piece of the total before it.",
              ctaLabel: "Play 6 pieces, 10 seconds",
              setup: {
                pieceCount: 6,
                memorizeTime: 10,
              },
            },
          ],
        },
      ],
    },
    {
      id: "when-to-raise",
      title: "When to add minutes to the block",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Add minutes only when two things hold. Your games have stopped losing to patterns you already solve, and the recall check stays level after the block.",
            "Add five minutes at a time, not double. Hold the new length for two weeks before judging it, and go back if the after-block total starts dropping.",
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: "Is one puzzle a day worth anything?",
      answer:
        "Yes, if it is the position from your own game where you missed the tactic. It is the one puzzle guaranteed to be about your games.",
    },
    {
      question: "Puzzles before or after games?",
      answer:
        "A few easy ones before, to get your eyes onto a board. Do the main block on its own, and not straight after a loss when you are annoyed.",
    },
    {
      question: "Should the puzzles be themed or mixed?",
      answer:
        "Themed while a pattern is new, so you meet it several times in a row. Mixed once you can name it on sight, so it hides among others the way it does in a game.",
    },
    {
      question: "What if I enjoy doing fifty?",
      answer:
        "Then do fifty and call it play. Count only the checked ones as study, and do those first while you are fresh.",
    },
  ],
  relatedArticles: [
    {
      slug: "why-puzzle-rating-doesnt-transfer-to-games",
      reason: "Why puzzle skill can sit unused in your games, whatever the count.",
    },
    {
      slug: "20-minute-daily-chess-study-plan",
      reason: "Where a six-puzzle block sits inside a full short session.",
    },
    {
      slug: "chess-pattern-recognition-drills",
      reason: "What to do with a pattern once you can name it.",
    },
  ],
  sources: [],
};

export default guide;
