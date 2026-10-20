import type { LearnDocument } from "../schema";

const guide: LearnDocument = {
  meta: {
    slug: "memory-chess-vs-lichess-coordinate-trainer",
    title: "Memory Chess vs the Lichess Coordinate Trainer",
    h1: "Memory Chess vs the Lichess coordinate trainer: two different skills",
    description: "The Lichess coordinate trainer drills square names in 30 seconds. Memory Chess drills rebuilding a position. What each trains, and why to use both.",
    group: "compare",
    level: "beginner",
    publishedAt: "2026-10-20T00:00:00.000Z",
    updatedAt: "2026-10-20T00:00:00.000Z",
    questions: [
      "Is the Lichess coordinate trainer enough for visualization?",
      "What should I train after chess coordinates?",
      "Are there alternatives to the Lichess coordinate trainer?",
    ],
    keywords: {
      primary: "lichess coordinate trainer alternative",
      secondary: [
        "lichess coordinate trainer",
        "chess coordinates vs position memory",
        "chess square naming practice",
        "chess position memory trainer",
      ],
    },
  },
  comparison: {
    checkedAt: "2026-10-20T00:00:00.000Z",
    disclosure: "Memory Chess makes one of the two tools on this page and publishes the page. Facts about Lichess come from its own public pages.",
  },
  intro: {
    quickAnswer: "They train two different skills, so most players gain from doing both. The Lichess coordinate trainer asks you to find or name as many squares as you can in 30 seconds. Memory Chess shows a position for 1 to 60 seconds, clears the board and asks you to put every piece back.",
    takeaways: [
      "Coordinates are the map. Position memory is holding what stands on it.",
      "Lichess's drill is free, with a 30-second timed mode and an untimed one.",
      "Memory Chess is free with no account, and counts from 2 to 32 pieces.",
      "Learn the squares first. A piece you cannot name a square for is a piece you cannot remember precisely.",
    ],
    audience: [
      "Players who already use the Lichess coordinate trainer and wonder what comes next.",
      "Beginners deciding where to start with board vision.",
    ],
  },
  sections: [
    {
      id: "two-skills",
      heading: "Naming a square and remembering a position",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "On Lichess, a square name appears and you click that square, or a square is highlighted and you type its name. The page says knowing the coordinates is an important skill. It is: every book, video and game record is written in them.",
            "Memory Chess asks a different question. You see a position, the pieces vanish, and you place each one again on the square where it stood. The coordinates are always shown on the board, so the test is the position, not the square names.",
          ],
        },
        {
          kind: "table",
          columns: ["Feature", "Lichess coordinate trainer", "Memory Chess"],
          rows: [
            {
              label: "What it trains",
              cells: ["Finding and naming squares.", "Remembering where every piece stood."],
            },
            {
              label: "One round",
              cells: [
                "30 seconds to map as many squares as you can, or untimed.",
                "A look of 1 to 60 seconds, then you place the pieces again.",
              ],
            },
            {
              label: "Modes",
              cells: [
                "Find square and name square, playing as White, Black or a random side. You can practise only some files and ranks.",
                "Presets of 2, 6, 12 and 20 pieces, or any count from 2 to 32.",
              ],
            },
            {
              label: "Labels and pieces",
              cells: [
                "Show coordinates, coordinates on every square, and show pieces can each be turned on or off.",
                "File letters and rank numbers are on every board.",
              ],
            },
            {
              label: "What you get back",
              cells: ["Not stated on the page beyond mapping as many squares as possible.", "An accuracy percentage and a skill rating."],
            },
            {
              label: "Cost and account",
              cells: ["Free. Lichess says all of its features are free for everyone.", "Free. No account."],
            },
          ],
        },
      ],
    },
    {
      id: "use-both",
      heading: "How to use both",
      blocks: [
        {
          kind: "list",
          ordered: true,
          items: [
            "Start on Lichess. Use the untimed mode until you stop counting along the edge to find a square.",
            "Switch Lichess to the 30-second mode, and play a few rounds a day from both sides of the board.",
            "Add Memory Chess rounds of 4 to 6 pieces. Say each piece and its square aloud while you look.",
            "When square names come without effort, keep Memory Chess as the daily drill and raise the piece count.",
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "This order is a judgement, not a measured result. It follows the coordinates guide on this site, which puts squares before whole positions.",
          ],
        },
      ],
    },
  ],
  end: [
    {
      kind: "cta",
      target: { kind: "game", label: "Play 4 pieces, 12 seconds", pieceCount: 4, memorizeTime: 12 },
      why: "Four pieces with twelve seconds leaves time to say each square aloud, the habit both tools build.",
    },
    {
      kind: "furtherReading",
      items: [
        {
          kind: "guide",
          slug: "chess-coordinates-practice",
          reason: "Anchor squares and a colour rule to learn the board faster.",
        },
        {
          kind: "guide",
          slug: "lichess-vs-chess-com-visualization-training",
          reason: "What Lichess and Chess.com each offer beyond coordinates.",
        },
      ],
    },
    {
      kind: "sources",
      items: [
        { title: "Lichess: Coordinate training", url: "https://lichess.org/training/coordinate" },
        { title: "Lichess: Features", url: "https://lichess.org/features" },
      ],
    },
  ],
};

export default guide;
