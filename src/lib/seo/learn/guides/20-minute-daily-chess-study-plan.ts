import type { LearnGuide } from "../schema";

const guide: LearnGuide = {
  slug: "20-minute-daily-chess-study-plan",
  goal: "routine",
  title: "20-Minute Daily Chess Study Plan for Beginners",
  h1: "A 20-minute daily chess study plan for beginners",
  description:
    "Twenty minutes in four fixed blocks. Three memory rounds, seven minutes of slow puzzles, seven minutes on one of your games, three for a written line.",
  primaryKeyword: "20 minute daily chess study plan",
  secondaryKeywords: [
    "daily chess routine for beginners",
    "short chess study plan",
    "20 minute chess improvement",
    "beginner chess schedule",
    "chess routine with puzzles and review",
  ],
  ctaLabel: "Play 6 pieces, 10 seconds",
  quickAnswer:
    "Minutes 0 to 3, three rounds of 6 pieces at 10 seconds. Minutes 3 to 10, six puzzles solved slowly with the reply checked. Minutes 10 to 17, one of your games replayed with a single question per move. Minutes 17 to 20, one written line.",
  keyTakeaways: [
    "Six puzzles in seven minutes leaves time to say the reply before each move.",
    "The written line is what carries one day into the next.",
  ],
  whoThisIsFor: [
    "You have twenty minutes on a weekday and want them filled in advance.",
    "You keep starting study plans that need an hour.",
    "You play games and never look at them again.",
  ],
  timeToRead: "7 min read",
  difficulty: "Beginner",
  publishedAt: "2026-03-24T00:00:00.000Z",
  updatedAt: "2026-09-15T00:00:00.000Z",
  sections: [
    {
      id: "why-twenty",
      title: "Why twenty minutes most days beats two hours on Sunday",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "The plan is short because it has to happen on a Tuesday when you are tired. A plan you skip three days a week is not a plan.",
            "Memory research points the same way. In verbal recall studies, practice spread across sessions was retained better than the same practice massed into one sitting.",
            "So the twenty minutes are fixed and the days are what you protect. Aim for five days a week, and treat a missed day as a reason to start again tomorrow.",
          ],
        },
      ],
    },
    {
      id: "timetable",
      title: "The timetable, minute by minute",
      blocks: [
        {
          kind: "plan",
          steps: [
            {
              label: "Minutes 0 to 3",
              duration: "3 minutes",
              detail:
                "Three rounds of 6 pieces, 10 seconds. Name each piece and square while it is on screen, then rebuild it.",
            },
            {
              label: "Minutes 3 to 10",
              duration: "7 minutes",
              detail:
                "Six puzzles at a little over a minute each. Before you play the move, say what your opponent's best reply is.",
            },
            {
              label: "Minutes 10 to 17",
              duration: "7 minutes",
              detail:
                "One of your own recent games, replayed from the start. At each of your moves, ask what the last opponent move newly attacks.",
            },
            {
              label: "Minutes 17 to 20",
              duration: "3 minutes",
              detail:
                "One line in a notebook. The move you would take back, and which block would have caught it.",
            },
          ],
        },
      ],
    },
    {
      id: "warm-up",
      title: "Minutes 0 to 3, the recall warm-up",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "The medium preset in Memory Chess is 6 pieces with 10 seconds to look. Three rounds of it fit in three minutes, with a moment to read each result.",
            "After the 10 seconds the board clears. Placing has no time limit, but the clock runs from the moment the board clears until you submit.",
            "Try Again on the result screen keeps the same settings and generates a new position. The three rounds are three different boards, so none of them can be remembered from yesterday.",
            "Naming every piece aloud makes the first thing in the session a full read of a board. The puzzles and the game block both start from that habit.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Three rounds at the medium preset",
              description:
                "Play 6 pieces with 10 seconds to look, 3 rounds in a row. Say each piece and its square while the position is up.",
              duration: "about 3 minutes",
              goal: "Three rounds with every piece on the right square.",
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
      id: "tactics-block",
      title: "Minutes 3 to 10, six puzzles with the reply spoken",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Six puzzles in seven minutes is slow on purpose. The habit being built is not finding the move. It is checking the move against the reply before you play it.",
            "So for each puzzle, find your move, then say out loud the reply that would refute it if there is one. Only then play it.",
            "A wrong answer after that check shows you a reply you could not see. A right answer without it shows you nothing about your checking.",
            "If a puzzle site shows a rating, ignore it for these seven minutes. The block is measured by whether you said the reply, not by the number.",
          ],
        },
      ],
    },
    {
      id: "game-block",
      title: "Minutes 10 to 17, your own game with one question per move",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Take your most recent game and replay it from move one. At each of your moves, before you look at what you played, say what the opponent's last move newly attacks.",
            "You will reach a move where you missed it. That is the move that matters today. Look at what the board told you and what you did instead.",
            "Seven minutes is about 15 seconds for each of your moves in a 28-move game. If the game runs longer, stop where the block ends.",
          ],
        },
      ],
    },
    {
      id: "the-line",
      title: "Minutes 17 to 20, the one written line",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Write one line. Which move you would take back, and which block would have caught it. For example, move 14, knight left on e5 with no defender, the game block.",
            "The line is what makes tomorrow's session different from today's. Read yesterday's line before you start the warm-up.",
          ],
        },
      ],
    },
    {
      id: "after-two-weeks",
      title: "What to change after two weeks, and what to leave alone",
      blocks: [
        {
          kind: "steps",
          ordered: false,
          items: [
            "If the warm-up rounds finish with every piece right three days running, switch to the 8-piece round below and keep 10 seconds.",
            "Eight pieces take longer to place, so play two rounds instead of three and the warm-up still ends at minute 3.",
            "If the puzzles feel easy, raise their difficulty, not their number. Six stays six.",
            "If the written line names the same block every day, give that block an extra minute and take it from the line.",
            "Leave the order of the blocks alone. A fixed order means no minutes go on deciding what to do next.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Two rounds of eight, once six is clean",
              description:
                "Play 8 pieces with 10 seconds to look, 2 rounds. Name the pieces in groups of two or three rather than one at a time.",
              duration: "about 2 minutes",
              goal: "Two rounds with every piece on the right square.",
              ctaLabel: "Play 8 pieces, 10 seconds",
              setup: {
                pieceCount: 8,
                memorizeTime: 10,
              },
            },
          ],
        },
      ],
    },
  ],
  faq: [],
  relatedArticles: [
    {
      slug: "how-to-get-better-at-chess-for-beginners",
      reason: "The four stages this timetable is built from, and the order they come in.",
    },
    {
      slug: "how-to-analyze-chess-games-for-beginners",
      reason: "A fuller version of the game block for days with more time.",
    },
    {
      slug: "how-many-chess-puzzles-a-day",
      reason: "How to set a puzzle count when you have more than seven minutes.",
    },
  ],
  sources: [
    {
      title: "Distributed Practice in Verbal Recall Tasks: A Review and Quantitative Synthesis",
      url: "https://doi.org/10.1037/0033-2909.132.3.354",
      note: "Supports the claim that in verbal recall studies, practice spread across sessions was retained better than the same practice massed into one sitting.",
    },
  ],
};

export default guide;
