import type { LearnDocument } from "../schema";

const guide: LearnDocument = {
  meta: {
    slug: "20-minute-daily-chess-study-plan",
    title: "20-Minute Daily Chess Study Plan for Beginners",
    h1: "A 20-minute daily chess study plan for beginners",
    description: "A 20-minute daily chess study plan in four fixed blocks. Three memory rounds, six slow puzzles, one of your own games, and one written line for tomorrow.",
    group: "practice",
    level: "beginner",
    publishedAt: "2026-03-24T00:00:00.000Z",
    updatedAt: "2026-10-13T00:00:00.000Z",
    questions: [
      "How should I spend 20 minutes a day on chess?",
      "What is a good daily chess routine for beginners?",
      "Where do games fit in a 20-minute chess routine?",
      "What if I miss a day of chess study?",
    ],
    keywords: {
      primary: "20 minute daily chess study plan",
      secondary: [
        "daily chess routine for beginners",
        "short chess study plan",
        "20 minute chess improvement",
        "beginner chess schedule",
        "chess routine with puzzles and review",
      ],
    },
  },
  intro: {
    quickAnswer: "A 20-minute daily chess study plan works best as four fixed blocks in the same order. Spend 3 minutes on three memory rounds of 6 pieces and 7 on six slow puzzles with the reply checked. Then spend 7 replaying your latest game and 3 writing one line about the move you would take back.",
    takeaways: [
      "Same four blocks, same order, five days a week.",
      "Six puzzles in seven minutes leaves time to name the reply before each move.",
      "The written line carries one day into the next. Read it before you start.",
    ],
    audience: [
      "You have twenty minutes on a weekday and want them filled in advance.",
      "You keep starting study plans that need an hour.",
      "You play games and never look at them again.",
    ],
  },
  sections: [
    {
      id: "why-twenty",
      heading: "Why twenty minutes most days beats two hours on Sunday",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "The plan is short because it has to happen on a Tuesday when you are tired. A long plan you skip three days a week trains less than a short one you keep.",
            "Memory research points the same way. In verbal recall studies, practice spread across sessions was retained better than the same practice massed into one sitting.",
            "So the twenty minutes stay fixed and the days are what you protect. Aim for five days a week.",
            "After a missed day, start again with the same four blocks and do not double up. Forty minutes in one sitting is the massed practice those studies found weaker.",
          ],
        },
      ],
    },
    {
      id: "timetable",
      heading: "The timetable, minute by minute",
      blocks: [
        {
          kind: "plan",
          steps: [
            {
              label: "Minutes 0 to 3",
              duration: "3 minutes",
              detail: "Three rounds of 6 pieces, 10 seconds. Name each piece and square while it is on screen, then rebuild it.",
            },
            {
              label: "Minutes 3 to 10",
              duration: "7 minutes",
              detail: "Six puzzles at a little over a minute each. Before you play the move, say what your opponent's best reply is.",
            },
            {
              label: "Minutes 10 to 17",
              duration: "7 minutes",
              detail: "One of your own recent games, replayed from the start. At each of your moves, ask what the last opponent move newly attacks.",
            },
            {
              label: "Minutes 17 to 20",
              duration: "3 minutes",
              detail: "One line in a notebook. The move you would take back, and which block would have caught it.",
            },
          ],
        },
      ],
    },
    {
      id: "warm-up",
      heading: "Minutes 0 to 3, the recall warm-up",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "The medium preset in Memory Chess is 6 pieces with 10 seconds to look. Three rounds of it fit in three minutes, with a moment to read each result.",
            "Press Try Again on the result screen for the next round. It keeps the settings and deals a new position, so no round can be remembered from yesterday.",
            "Name each piece and its square aloud while the board is up. The session then opens with a full read of a board, which the puzzles and your game ask for next.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Three rounds at the medium preset",
              description: "Play 6 pieces with 10 seconds to look, 3 rounds in a row. Say each piece and its square while the position is up.",
              duration: "about 3 minutes",
              goal: "Three rounds with every piece on the right square.",
              play: { label: "Play 6 pieces, 10 seconds", pieceCount: 6, memorizeTime: 10 },
            },
          ],
        },
      ],
    },
    {
      id: "tactics-block",
      heading: "Minutes 3 to 10, six puzzles with the reply spoken",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Six puzzles in seven minutes is slow on purpose. The habit this block builds is the check between finding a move and playing it.",
            "For each puzzle, find your move. Then say aloud the reply that would refute it, if one exists. Play the move only once you have named that reply or ruled it out.",
            "A wrong answer after that check shows you a reply you could not see. A right answer without it shows you nothing about your checking.",
            "If the puzzle site shows a rating, ignore it for these seven minutes. Score the block on one thing, whether you said the reply before every move.",
          ],
        },
      ],
    },
    {
      id: "game-block",
      heading: "Minutes 10 to 17, your own game with one question per move",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Take your most recent game and step through it from move one. Pause before each of your moves appears and say what your opponent's last move newly attacks.",
            "Sooner or later you reach a move where you missed it. That move is today's lesson. Compare what the board was showing with the move you played.",
            "Seven minutes gives about 15 seconds to each of your moves in a 28-move game. If the game runs longer, stop when the block ends.",
            "Play your games outside the twenty minutes, at a slow control such as 15 minutes plus 10 seconds. The block reviews games you have already played, so it needs a steady supply.",
          ],
        },
      ],
    },
    {
      id: "the-line",
      heading: "Minutes 17 to 20, the one written line",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Write one line. Name the move you would take back and the block that trains what would have caught it. For example, move 14, knight left on e5 with no defender, game block.",
            "Read yesterday's line before you start the warm-up. It is what makes each session build on the one before.",
          ],
        },
      ],
    },
    {
      id: "after-two-weeks",
      heading: "What to change after two weeks, and what to leave alone",
      blocks: [
        {
          kind: "list",
          ordered: false,
          items: [
            "If the warm-up rounds finish with every piece right three days running, switch to the 8-piece round below and keep 10 seconds.",
            "Eight pieces take longer to place, so play two rounds instead of three and the warm-up still ends by minute 3.",
            "If the puzzles feel easy, choose harder ones and keep the count at six.",
            "If the written line names the same block every day, give that block an extra minute and take it from the line.",
            "Leave the order of the blocks alone. A fixed order means no minutes go on deciding what to do next.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Two rounds of eight, once six is clean",
              description: "Play 8 pieces with 10 seconds to look, 2 rounds. Name the pieces in groups of two or three rather than one at a time.",
              duration: "about 2 minutes",
              goal: "Two rounds with every piece on the right square.",
              play: { label: "Play 8 pieces, 10 seconds", pieceCount: 8, memorizeTime: 10 },
            },
          ],
        },
      ],
    },
  ],
  end: [
    {
      kind: "cta",
      target: { kind: "game", label: "Play 6 pieces, 10 seconds", pieceCount: 6, memorizeTime: 10 },
      why: "This is the first block of the twenty minutes. Three rounds at this setting and today's session has started.",
    },
    {
      kind: "cta",
      target: { kind: "stat", tile: "days", label: "Count your days played" },
      why: "The plan asks for five days a week, and days played is the figure that records whether the twenty minutes happened.",
    },
    {
      kind: "furtherReading",
      items: [
        {
          kind: "guide",
          slug: "how-to-get-better-at-chess-for-beginners",
          reason: "The four stages, including the slow game each day that these twenty minutes leave out.",
        },
        {
          kind: "guide",
          slug: "how-to-analyze-chess-games-for-beginners",
          reason: "A fuller version of the game block for days with more time.",
        },
        {
          kind: "guide",
          slug: "how-many-chess-puzzles-a-day",
          reason: "How to set a puzzle count when you have more than seven minutes.",
        },
        {
          kind: "guide",
          slug: "how-to-stop-blundering-in-chess",
          reason: "The full pre-move scan that grows out of the game block's one question.",
        },
      ],
    },
    {
      kind: "sources",
      items: [
        {
          title: "Distributed Practice in Verbal Recall Tasks: A Review and Quantitative Synthesis",
          note: "Supports the claim that in verbal recall studies, practice spread across sessions was retained better than the same practice massed into one sitting.",
          url: "https://doi.org/10.1037/0033-2909.132.3.354",
        },
      ],
    },
  ],
};

export default guide;
