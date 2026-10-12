import type { LearnDocument } from "../schema";

const guide: LearnDocument = {
  meta: {
    slug: "why-puzzle-rating-doesnt-transfer-to-games",
    title: "Why Puzzle Rating Doesn't Transfer to Games",
    h1: "Why your puzzle rating doesn't transfer to games",
    description: "Why puzzle rating doesn't transfer to games: four things a puzzle gives you that a game takes away, and a five-game test to find which one costs you.",
    group: "board-vision",
    level: "beginner",
    publishedAt: "2026-03-24T00:00:00.000Z",
    updatedAt: "2026-09-15T00:00:00.000Z",
    questions: [
      "Why is my puzzle rating higher than my game rating?",
      "Why can I solve puzzles but miss tactics in games?",
      "Do puzzle skills transfer to real games?",
    ],
    keywords: {
      primary: "why puzzle rating doesn't transfer to games",
      secondary: [
        "puzzle rating vs chess rating",
        "tactics not transferring to games",
        "chess puzzle skill in real games",
        "why am i better at puzzles than games",
        "board vision in chess",
      ],
    },
  },
  intro: {
    quickAnswer: "Puzzle rating doesn't transfer to games because a puzzle does half the work for you. It promises a tactic, tells you which side has it, draws the current position fresh and lets you look with no opponent waiting. A game gives you none of that, so you have to find the conditions for a tactic before you can solve it.",
    takeaways: [
      "Puzzle and game ratings come from separate pools, so the gap between them proves nothing on its own.",
      "Each of the four things a puzzle hands you needs a habit to replace it at the board.",
      "Scan for a loose piece, a lined-up pair or a king with no flight squares, and calculate only when one appears.",
      "Five slow games and one engine check show whether your missed tactics are a scanning problem or a calculation problem.",
    ],
    audience: [
      "Your puzzle rating is several hundred points above your game rating.",
      "You see the tactic on the analysis screen and wonder how you missed it.",
      "You are about to buy a bigger puzzle set.",
    ],
  },
  sections: [
    {
      id: "two-ratings",
      heading: "Why your puzzle rating sits above your game rating",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "A puzzle rating measures a real skill. It shows how reliably you find a winning move once you know one exists.",
            "It is also measured in its own pool. Puzzle sites rate you against the puzzles you solve, while games rate you against other players. Puzzle ratings often sit higher because the two scales are set separately, so the gap alone does not mean you play below your level. What the gap can hide is the four gifts below. They make a puzzle easier than the same tactic in a game.",
            "The real sign of a transfer problem shows up in your games. You lose to a fork you would solve in ten seconds as a puzzle, then spot it at once on the analysis screen.",
          ],
        },
      ],
    },
    {
      id: "four-gifts",
      heading: "Four things a puzzle gives you that a game takes away",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "A standard rated puzzle is solved under four conditions, and a game removes all four. Each one needs a habit to stand in for it.",
          ],
        },
        {
          kind: "table",
          columns: ["What a puzzle gives you", "What a game gives you instead", "The habit that replaces it"],
          rows: [
            {
              label: "A promise that a tactic is there",
              cells: [
                "Most moves offer no winning tactic to either side",
                "Look for the conditions a tactic needs, and calculate only when one appears",
              ],
            },
            {
              label: "Which side has the tactic, marked",
              cells: [
                "Threats run both ways, and the tactic you spot may be your opponent's",
                "Check your opponent's checks, captures and threats before your own ideas",
              ],
            },
            {
              label: "The current position, drawn fresh",
              cells: [
                "A picture in your head, built one move at a time",
                "Ask what the last move changed before you trust the picture",
              ],
            },
            {
              label: "Time to look with no opponent waiting",
              cells: [
                "Every second of scanning comes off your own clock",
                "Keep the scan short and in a fixed order so it fits every move",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "stale-board",
      heading: "Why the board in your head goes stale by the middlegame",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Of the four, the fresh diagram is the easiest to overlook. In a game the position reaches you one move at a time, over half an hour or more.",
            "By move 25 your picture can lag behind the board. It is the position from a few moves back with the recent changes patched in. The usual error sits around the last move rather than on it: the square a piece left, or the line it opened.",
            "A puzzle never tests this. Its diagram is complete and current, so your puzzle rating has never once been measured on a stale picture.",
            "A Memory Chess round tests the picture itself. Take a hard preset of 12 pieces with 8 seconds to look. The board goes blank, you rebuild it, and the result board marks each square you got wrong or missed, so you see where your picture split from the real one.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Flag the square you doubt",
              description: "Run 3 rounds in a row at 12 pieces and 8 seconds. Before you submit each rebuild, say aloud the one square you are least sure of. On the result board, compare that square with the squares marked wrong or missed.",
              duration: "about 5 minutes",
              goal: "In each round, no square is marked wrong or missed except, at most, the one you flagged. An unflagged miss is a piece your picture lost without warning, the same slip that drops a piece in a game.",
              play: { label: "Play 12 pieces, 8 seconds", pieceCount: 12, memorizeTime: 8 },
            },
          ],
        },
      ],
    },
    {
      id: "what-transfers",
      heading: "Puzzle patterns that do transfer to games",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Many puzzle patterns turn up in real games. Take a knight on c7 forking a king on e8 and a rook on a8, or a bishop on g5 pinning a knight on f6 to a queen on d8.",
            "They transfer under one condition. You have to spot the precondition first, because nothing at the board tells you a tactic is there.",
          ],
        },
        {
          kind: "board",
          position: {
            id: "fork-on-c7",
            white: ["Kg1", "Nb5"],
            black: ["Ke8", "Ra8"],
            unstated: ["g1"],
            claims: [
              { kind: "attackers", square: "c7", side: "b", from: [] },
              { kind: "legal", move: "Nc7+" },
            ],
          },
          arrows: [{ from: "b5", to: "c7", kind: "attack" }],
          marks: [{ square: "c7", kind: "ring" }],
          caption: "No Black piece guards c7 and the knight on b5 reaches it, so Nc7+ forks the king and the rook.",
        },
        {
          kind: "prose",
          paragraphs: [
            "The fork works because nothing guards c7 and your knight on b5 can reach it. The pin works because the knight stands on the diagonal between the bishop and the queen, with e7 empty.",
            "So the habit that carries puzzles into games is a scan for three preconditions, on both sides of the board.",
          ],
        },
        {
          kind: "list",
          ordered: false,
          items: [
            "A loose piece, one that nothing defends. Any attack on it is already a threat.",
            "A lined-up pair, like the knight on f6 in front of the queen on d8. Two pieces of one side share a file, rank or diagonal. With the more valuable one behind, a bishop, rook or queen on that line pins the front piece. With it in front, the same attack skewers them.",
            "A king with no flight squares, where a single check can end the game.",
          ],
        },
        {
          kind: "prose",
          paragraphs: ["When one of these is on the board, and only then, stop and solve the position like a puzzle."],
        },
      ],
      facts: [
        {
          id: "fork-on-c7-played",
          white: ["Kg1", "Nb5"],
          black: ["Ke8", "Ra8"],
          unstated: ["g1"],
          line: ["Nc7+"],
          claims: [{ kind: "check" }, { kind: "attacks", from: "c7", squares: ["e8", "a8"] }],
        },
        {
          id: "pin-on-f6",
          white: ["Kg1", "Bg5"],
          black: ["Kg8", "Nf6", "Qd8"],
          unstated: ["g1", "g8"],
          claims: [
            { kind: "occupant", square: "e7", piece: null },
            { kind: "attacks", from: "g5", squares: ["f6"] },
          ],
        },
        {
          id: "pin-on-f6-without-the-knight",
          white: ["Kg1", "Bg5"],
          black: ["Kg8", "Qd8"],
          unstated: ["g1", "g8"],
          claims: [{ kind: "attacks", from: "g5", squares: ["d8"] }],
        },
      ],
    },
    {
      id: "the-test",
      heading: "A five-game test for scanning or calculation misses",
      blocks: [
        {
          kind: "list",
          ordered: true,
          items: [
            "Play five games at 15 minutes with a 10-second increment. Blitz is too fast, and the test would measure your clock.",
            "Before each of your moves, name the squares your opponent's last move newly attacks and whether anything on them is loose.",
            "Whenever you notice a loose piece, a lined-up pair or a king with no flight squares, for either side, write down the move number.",
            "After each game, run the engine once and list every tactic it found for either side. Compare that list with your notes.",
            "A tactic on a move you noted and still missed is a calculation problem. A tactic on a move you never noted is a scanning problem.",
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "If most misses are calculation, your scan works and puzzles are the right training. Keep solving them, and check the reply before you move.",
            "If most misses are scanning, more puzzles will not close the gap. A puzzle does the scanning for you by promising a tactic, so it never trains that step. Spend those minutes on the scan in slow games instead.",
          ],
        },
      ],
    },
  ],
  end: [
    {
      kind: "cta",
      target: { kind: "game", label: "Play 12 pieces, 8 seconds", pieceCount: 12, memorizeTime: 8 },
      why: "The blank board after eight seconds shows where your picture of the position split from the real one, a check no puzzle diagram runs.",
    },
    {
      kind: "faq",
      items: [
        {
          question: "Should I stop doing chess puzzles?",
          answer: "No. Puzzles still build the patterns your scan needs to recognise once it finds a precondition. Keep them if the five-game test points to calculation. If it points to scanning, shorten the puzzle block and spend those minutes running the scan in slow games, where the habit has to work.",
        },
        {
          question: "Are Puzzle Rush and Puzzle Storm closer to a real game?",
          answer: "They add a clock, so they remove one of the four gifts. Every position still holds a tactic and still tells you which side has it, so they train how fast you solve and leave the scan untrained. Treat them as quick pattern practice, and keep slow games for the scan.",
        },
      ],
    },
    {
      kind: "furtherReading",
      items: [
        {
          kind: "guide",
          slug: "how-to-stop-blundering-in-chess",
          reason: "Turns the precondition scan into a full five-step check before every move.",
        },
        {
          kind: "guide",
          slug: "how-many-chess-puzzles-a-day",
          reason: "Sets a puzzle count from your minutes, for when the test says calculation.",
        },
        {
          kind: "guide",
          slug: "chess-pattern-recognition-drills",
          reason: "Trains the fork and pin shapes that do carry over, square by square.",
        },
        {
          kind: "guide",
          slug: "how-to-analyze-chess-games-for-beginners",
          reason: "Shows how to review each of the five test games without drowning in engine lines.",
        },
      ],
    },
  ],
};

export default guide;
