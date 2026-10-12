import type { LearnDocument } from "../schema";

const guide: LearnDocument = {
  meta: {
    slug: "how-to-analyze-chess-games-for-beginners",
    title: "How to Analyze Chess Games for Beginners in 10 Minutes",
    h1: "How to analyze chess games for beginners",
    description: "Learn how to analyze chess games for beginners in ten minutes. Find the move that decided the game, explain it before the engine does, and label the mistake.",
    group: "practice",
    level: "beginner",
    publishedAt: "2026-03-24T00:00:00.000Z",
    updatedAt: "2026-10-13T00:00:00.000Z",
    questions: [
      "How do I analyze my own chess games as a beginner?",
      "Should beginners use a chess engine to review games?",
      "How long should a chess game review take?",
      "What should I look for when reviewing a lost chess game?",
    ],
    keywords: {
      primary: "how to analyze chess games for beginners",
      secondary: [
        "beginner chess game review",
        "how to review chess games",
        "chess self analysis beginners",
        "analyze blunders in chess",
        "post game chess routine",
      ],
    },
  },
  intro: {
    quickAnswer: "To analyze a chess game as a beginner, review only the move that decided it. Set that position up from memory and write one sentence on why the move was bad, before the engine sees it. Then label the mistake by its cause and close the game, ten minutes in all.",
    takeaways: [
      "One decisive move per game. Ignore the rest.",
      "Write your reason before the engine shows its line, or the engine's reason can replace yours.",
      "Label it never looked, looked and misjudged, or knew and rushed, and let the count choose your training.",
    ],
    audience: [
      "You lose, open the analysis, look at the graph and learn nothing.",
      "You have been told to review your games and do not know what that means in practice.",
      "You want a routine that fits between games.",
    ],
  },
  sections: [
    {
      id: "one-move",
      heading: "Find the one move that decided the game",
      blocks: [
        {
          kind: "prose",
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
      heading: "Write your reason before the engine gives its own",
      blocks: [
        {
          kind: "prose",
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
      heading: "Three labels for a beginner mistake",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Take one lost queen as the example. Your bishop stands on g5, Black has a knight on f6 and a queen on d7, and you play your queen to h5. The knight takes it. The same move can come from three different causes.",
          ],
        },
        {
          kind: "board",
          position: {
            id: "knight-takes-the-queen-on-h5",
            white: ["Kg1", "Bg5", "Qh5"],
            black: ["Ke8", "Qd7", "Nf6", "f7"],
            toMove: "b",
            unstated: ["g1", "e8", "f7"],
            claims: [
              { kind: "attacks", from: "f6", squares: ["h5"] },
              { kind: "attacks", from: "g5", squares: ["f6"] },
              { kind: "occupant", square: "d8", piece: null },
              { kind: "noCheck" },
              { kind: "legal", move: "Nxh5" },
            ],
          },
          arrows: [
            { from: "f6", to: "h5", kind: "attack" },
            { from: "g5", to: "f6", kind: "attack" },
          ],
          marks: [{ square: "d8", kind: "ring" }],
          caption: "Your bishop on g5 aims through the knight at an empty d8, so the knight on f6 is free to take the queen on h5.",
        },
        {
          kind: "list",
          ordered: false,
          items: [
            "Never looked. You did not check what the knight on f6 attacked. It had stood there for ten moves and your eyes never went to it.",
            "Looked and misjudged. You saw the knight but counted it as pinned by your bishop. Black's queen had left d8 for d7 a move earlier, so nothing stood behind it.",
            "Knew and rushed. You saw the knight could take on h5, had 30 seconds on the clock, and played the move anyway. Treat this as a clock problem, and play longer games before you study more.",
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "Write the label next to the sentence. After ten games, count the labels. The one that leads is your training plan.",
          ],
        },
      ],
    },
    {
      id: "ten-minutes",
      heading: "The ten-minute review, step by step",
      blocks: [
        {
          kind: "plan",
          steps: [
            {
              label: "Minute 1",
              duration: "1 minute",
              detail: "Name the decisive move from memory, before you open the game record.",
            },
            {
              label: "Minutes 2 to 4",
              duration: "3 minutes",
              detail: "Set the position up from memory. Check it against the record and note any piece you placed wrong or left out.",
            },
            {
              label: "Minutes 5 to 6",
              duration: "2 minutes",
              detail: "Write the sentence. Why the move was bad, in your own words.",
            },
            {
              label: "Minute 7",
              duration: "1 minute",
              detail: "Engine on, that position only. Add a second sentence if it saw something you did not.",
            },
            {
              label: "Minutes 8 to 9",
              duration: "2 minutes",
              detail: "Choose a label. Never looked, looked and misjudged, or knew and rushed.",
            },
            {
              label: "Minute 10",
              duration: "1 minute",
              detail: "Close everything. Do not scroll through the rest of the game.",
            },
          ],
        },
      ],
    },
    {
      id: "rebuild",
      heading: "Rebuild the position from memory, and what it tells you",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Do not skip minutes 2 to 4. A piece you cannot place from memory is a lead. Check whether it was one of the pieces that decided the move.",
            "If it was, the label is probably never looked. If the missing piece stood far from the action, your sentence and the engine will say more.",
            "Memory Chess trains the same rebuild on positions from outside your games. A position appears for a fixed number of seconds, the board clears, and you put the pieces back.",
            "The result screen then scores your board square by square as correct, wrong placement or missed square. A missed square is one where the position had a piece and your board does not have that piece there. The piece that belonged shows faded on it. A piece you put on the wrong square gives two marks: wrong placement where you put it, and a missed square where it stood.",
            "Start at 8 pieces with 10 seconds. That is two more pieces than the 6-piece medium preset, with the same time to look.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Rebuild eight pieces, then read the marks",
              description: "Play 8 pieces with 10 seconds to look, 3 rounds. After each round, count the faded pieces. Each one is a piece you did not put back where it stood.",
              duration: "about 4 minutes",
              goal: "Three rounds in a row with no more than one faded piece.",
              play: { label: "Play 8 pieces, 10 seconds", pieceCount: 8, memorizeTime: 10 },
            },
          ],
        },
      ],
    },
    {
      id: "next-session",
      heading: "Turning the label into tomorrow's first change",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "The review is only worth doing if it changes the next session. Each label points somewhere specific.",
          ],
        },
        {
          kind: "list",
          ordered: false,
          items: [
            "Never looked. Three rounds of the 8-piece drill above before tomorrow's game. In the game, say what the last move newly attacks before each of yours.",
            "Looked and misjudged. Set the position up again and calculate the line to the end, twice, with the pieces still. Then five slow puzzles.",
            "Knew and rushed. Play the next game at 15 minutes plus 10 seconds, and nothing faster for a week.",
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "One move, one sentence before the engine, one label, one change tomorrow. That is the whole review.",
          ],
        },
      ],
    },
  ],
  end: [
    {
      kind: "cta",
      target: { kind: "game", label: "Play 8 pieces, 10 seconds", pieceCount: 8, memorizeTime: 10 },
      why: "Rebuilding eight pieces from memory is the same skill as setting up the deciding position of a lost game.",
    },
    {
      kind: "faq",
      items: [
        {
          question: "Should I use the engine at all?",
          answer: "Yes, once, on the deciding position, after your own sentence is written. Skip the full-game accuracy graph and the list of every inaccuracy. Twenty engine comments on one game are too many to act on. One comment checked against your own reason gives you a habit to change.",
        },
        {
          question: "Should I review games I won?",
          answer: "Yes, the same way. Look for the move your opponent could have punished and did not. A win often hides a loose piece or a missed capture, and finding it in a review costs ten minutes instead of a game next week.",
        },
        {
          question: "How many games a week should I review?",
          answer: "Every slow game you play, ten minutes each. If that is more than your week allows, play fewer games rather than skipping reviews. An unreviewed loss tends to repeat, because the habit that caused it is still there.",
        },
        {
          question: "What if no single move decided the game?",
          answer: "Pick the earliest move after which you felt worse and write your sentence about it anyway. If the engine says you were already losing in that position, the real mistake came earlier. Note the move number and make that move your next review. One move per review still holds.",
        },
      ],
    },
    {
      kind: "furtherReading",
      items: [
        {
          kind: "guide",
          slug: "how-to-get-better-at-chess-for-beginners",
          reason: "The four-stage plan whose last stage, one line after every game, this review expands.",
        },
        {
          kind: "guide",
          slug: "20-minute-daily-chess-study-plan",
          reason: "A daily session with a seven-minute game block for days without ten minutes to spare.",
        },
        {
          kind: "guide",
          slug: "chess-memory-training",
          reason: "More rounds for the never looked label.",
        },
        {
          kind: "guide",
          slug: "how-to-stop-blundering-in-chess",
          reason: "Turns the never looked fix, naming what the last move attacks, into a full scan before each move.",
        },
      ],
    },
  ],
};

export default guide;
