import type { LearnPosition } from "../positions";
import type { LearnGuide } from "../schema";

const guide: LearnGuide = {
  slug: "how-to-analyze-chess-games-for-beginners",
  goal: "routine",
  title: "How to Analyze Chess Games for Beginners",
  h1: "How to analyze chess games for beginners",
  description:
    "A ten-minute review that ends in one sentence. Find the move that decided the game, write your reason before the engine gives its own, and label the mistake.",
  primaryKeyword: "how to analyze chess games for beginners",
  secondaryKeywords: [
    "beginner chess game review",
    "how to review chess games",
    "chess self analysis beginners",
    "analyze blunders in chess",
    "post game chess routine",
  ],
  ctaLabel: "Play 8 pieces, 10 seconds",
  quickAnswer:
    "Find the one move that decided the game. Set that position up from memory, write one sentence on why the move was bad, then run the engine on that position only. Label the mistake and close the game.",
  keyTakeaways: [
    "One decisive move per game. Ignore the rest.",
    "Write your reason before the engine shows its line, or the engine's reason can replace yours.",
    "Label it never looked, looked and misjudged, or knew and rushed, and let the count choose your training.",
  ],
  whoThisIsFor: [
    "You lose, open the analysis, look at the graph and learn nothing.",
    "You have been told to review your games and do not know what that means in practice.",
    "You want a routine that fits between games.",
  ],
  timeToRead: "7 min read",
  difficulty: "Beginner",
  publishedAt: "2026-03-24T00:00:00.000Z",
  updatedAt: "2026-09-15T00:00:00.000Z",
  sections: [
    {
      id: "one-move",
      title: "Find the one move that decided the game",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "When you lose a piece for nothing, the game turned at that move, whatever came after. Your review is about that move and almost nothing else.",
            "Find it without the engine. It is the move after which you were a piece down, or the move after which you stopped feeling fine.",
            "If two candidates compete, take the earlier one. The later mistake may be a reaction to the first.",
          ],
        },
      ],
    },
    {
      id: "before-engine",
      title: "Write your reason before the engine gives its own",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Set the position up, on a board or on screen, and write one sentence about why the move was bad. Do this before you switch the engine on.",
            "The engine will tell you the move was bad. It will not tell you which of your habits produced it. Only you can, and only if you answer first.",
            "Once the engine line is on screen, it is hard to recall what you would have said without it.",
            "Then run the engine, once, on that single position. If it agrees with your sentence, good. If it names something you did not see, write a second sentence about it.",
          ],
        },
      ],
    },
    {
      id: "three-labels",
      title: "Three labels for a beginner mistake",
      blocks: [
        {
          kind: "steps",
          ordered: false,
          items: [
            "Never looked. Your queen went to h5 and the knight on f6 took it. The knight was there the whole time and your eyes never went to it.",
            "Looked and misjudged. You saw the knight on f6 but counted it as pinned by your bishop on g5. It was pinned only to the queen on d8, and a pinned piece can still move.",
            "Knew and rushed. You knew h5 was risky, had 30 seconds on the clock, and played it anyway. Treat this as a clock problem, and play longer games before you study more.",
          ],
        },
        {
          kind: "paragraphs",
          paragraphs: [
            "Write the label next to the sentence. After ten games, count the labels. The one that leads is your training plan.",
          ],
        },
      ],
    },
    {
      id: "ten-minutes",
      title: "The ten-minute review, step by step",
      blocks: [
        {
          kind: "steps",
          ordered: true,
          items: [
            "Minute 1. Name the decisive move from memory, before opening the game record.",
            "Minutes 2 to 4. Set the position up from memory. Check it against the record and note any piece you placed wrong.",
            "Minutes 5 to 6. Write the sentence. Why the move was bad, in your own words.",
            "Minute 7. Engine on, that position only. A second sentence if it saw something you did not.",
            "Minutes 8 to 9. Choose a label. Never looked, looked and misjudged, or knew and rushed.",
            "Minute 10. Close everything. Do not scroll through the rest of the game.",
          ],
        },
      ],
    },
    {
      id: "rebuild",
      title: "Rebuild the position from memory, and what it tells you",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Do not skip minutes 2 to 4. A piece you cannot place from memory is a lead. Check whether it was one of the pieces that decided the move.",
            "If it was, the label is probably never looked. If the missing piece stood far from the action, your sentence and the engine will say more.",
            "Memory Chess trains the same rebuild on positions that are not from your games. A position appears for a fixed number of seconds, the board clears, and you put the pieces back.",
            "The result screen then marks squares against the original as Correct, Incorrect or Missed. A square marked Missed is one where the original had a piece and you placed nothing.",
            "On a screen 1024 pixels or wider the two boards sit side by side. Narrower screens stack the original above yours, so scroll to compare them.",
            "Start at 8 pieces with 10 seconds. That is two more pieces than the 6-piece medium preset, with the same time to look.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Rebuild eight pieces, then read the marks",
              description:
                "Play 8 pieces with 10 seconds to look, 3 rounds. After each round, find the squares marked Missed. Those are pieces you did not place at all.",
              duration: "about 4 minutes",
              goal: "No squares marked Missed, even with an Incorrect square or two.",
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
    {
      id: "next-session",
      title: "Turning the label into tomorrow's first change",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "The review is only worth doing if it changes the next session. Each label points somewhere specific.",
          ],
        },
        {
          kind: "steps",
          ordered: false,
          items: [
            "Never looked. Three rounds of the 8-piece drill above before tomorrow's game. In the game, say what the last move newly attacks before each of yours.",
            "Looked and misjudged. Set the position up again and calculate the line to the end, twice, with the pieces still. Then five slow puzzles.",
            "Knew and rushed. Play the next game at 15 minutes plus 10 seconds, and nothing faster for a week.",
          ],
        },
        {
          kind: "paragraphs",
          paragraphs: [
            "That is the whole method. One move, one sentence before the engine, one label, one change tomorrow.",
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: "Should I use the engine at all?",
      answer:
        "Yes, once, on one position, after you have written your own sentence. The engine is a check on your reasoning, not a replacement for it.",
    },
    {
      question: "What about my wins?",
      answer:
        "Review them the same way. A win can still contain a move your opponent could have punished. Finding it is cheaper than losing to it next week.",
    },
    {
      question: "How many games a week should I review?",
      answer:
        "Every game you play, for ten minutes each. If that is too many, play fewer games.",
    },
  ],
  relatedArticles: [
    {
      slug: "how-to-get-better-at-chess-for-beginners",
      reason: "The four stages the three labels map onto.",
    },
    {
      slug: "20-minute-daily-chess-study-plan",
      reason: "A seven-minute version of this review inside a fixed daily session.",
    },
    {
      slug: "chess-memory-training",
      reason: "More rounds for the never looked label.",
    },
    {
      slug: "how-to-stop-blundering-in-chess",
      reason: "Turns the never looked fix, naming what the last move attacks, into a full scan before each move.",
    },
  ],
  sources: [],
};

export const positions: LearnPosition[] = [
  {
    id: "knight-pinned-to-the-queen",
    sectionId: "three-labels",
    white: ["Kg1", "Bg5", "Qh5"],
    black: ["Ke8", "Qd8", "Nf6"],
    toMove: "b",
    unstated: ["g1", "e8"],
    claims: [
      { kind: "attacks", from: "f6", squares: ["h5"] },
      { kind: "attacks", from: "g5", squares: ["f6"] },
      { kind: "legal", move: "Nxh5" },
    ],
  },
  {
    id: "bishop-g5-behind-the-knight",
    sectionId: "three-labels",
    white: ["Kg1", "Bg5"],
    black: ["Ke8", "Qd8"],
    unstated: ["g1", "e8"],
    claims: [{ kind: "attacks", from: "g5", squares: ["d8"] }],
  },
];

export default guide;
