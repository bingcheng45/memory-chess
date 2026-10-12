import type { LearnDocument } from "../schema";

const guide: LearnDocument = {
  meta: {
    slug: "why-puzzle-rating-doesnt-transfer-to-games",
    title: "Why Puzzle Rating Doesn't Transfer to Games",
    h1: "Why your puzzle rating doesn't transfer to games",
    description: "A puzzle hands you four things a game never does. Until you replace them yourself, the rating stays on the puzzle site.",
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
    quickAnswer: "A puzzle hands you a fresh diagram, tells you whose move it is, promises there is something to find, and lets you look without cost. A game gives you none of that. The rating measures solving with those four gifts, and games test you without them.",
    takeaways: [
      "A game takes away all four gifts a puzzle gives, and the stale board in your head is easy to overlook.",
      "Scan for preconditions, loose pieces and lined-up pairs, and solve only when one appears.",
    ],
    audience: [
      "Your puzzle rating is several hundred points above your game rating.",
      "You see the tactic on the analysis screen and wonder how you missed it.",
      "You are about to buy a bigger puzzle set.",
    ],
  },
  sections: [
    {
      id: "the-claim",
      heading: "What a puzzle rating actually measures",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Puzzle rating is a real skill. It measures how reliably you find a winning move once you know one exists. That skill is worth having.",
            "It is also narrower than it looks. Every rated puzzle is solved under the same conditions, and the rating only ever measures you under them.",
            "Those conditions are the problem. Every one of them is missing in a game.",
          ],
        },
      ],
    },
    {
      id: "four-gifts",
      heading: "Four things a puzzle gives you and a game does not",
      blocks: [
        {
          kind: "list",
          ordered: false,
          items: [
            "A promise. Something is there. A game makes no such promise, and the skill is knowing which move is the exception.",
            "The side to move, marked. In a game you can spend a minute on a plan and then realise the tactic was your opponent's.",
            "A fresh diagram. The whole position, drawn once, with every piece equally visible. In a game the position arrived one move at a time over half an hour.",
            "Looking without cost. A puzzle can run with no clock at all. In a game every second you spend scanning comes off your own time.",
          ],
        },
        {
          kind: "prose",
          paragraphs: ["The third one is the least obvious, so the next section is about it."],
        },
      ],
    },
    {
      id: "stale-board",
      heading: "The stale board, a gift that is easy to overlook",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "By move 25 your picture of the board can lag behind the board. It can be the board as it was a few moves ago, with the recent changes patched in, so check those changes first.",
            "A puzzle never has this problem. The diagram is the position, complete and current. Your puzzle rating has never once been tested on a stale board.",
            "Strong players recall a briefly seen position in chunks, familiar groups of pieces stored as one unit. They rebuild the board from those groups rather than piece by piece.",
            "Memory Chess has a hard preset of 12 pieces with 8 seconds to look. That is two thirds of a second per piece.",
            "Try saying white knight c3 twelve times in eight seconds. That leaves no time to spare, so try seeing groups instead.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Twelve pieces, seen as shapes",
              description: "Play 12 pieces with 8 seconds to look, 3 rounds. Do not read piece by piece. Find the two or three groups, name them, and rebuild from the groups.",
              duration: "about 5 minutes",
              goal: "Rounds where the squares marked Missed sit inside a group you saw, not in a corner you never looked at.",
              play: { label: "Play 12 pieces, 8 seconds", pieceCount: 12, memorizeTime: 8 },
            },
          ],
        },
      ],
    },
    {
      id: "what-transfers",
      heading: "The patterns that do cross over, and the condition attached",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Some patterns do show up in games. A knight on c7 forking a king on e8 and a rook on a8. A bishop on g5 pinning a knight on f6 to a queen on d8.",
            "They transfer under one condition. You have to be looking at the precondition, not the tactic.",
            "The fork works because nothing guards c7 and your knight on b5 can reach it. The pin works because the knight stands on the diagonal between the bishop and the queen, with e7 empty.",
            "So the habit that carries puzzles into games is a scan for preconditions. Loose pieces, pieces on the same line as something valuable, a king with no flight squares.",
            "When one of those is on the board, and only then, you solve the position like a puzzle.",
          ],
        },
      ],
      facts: [
        {
          id: "fork-on-c7",
          white: ["Kg1", "Nb5"],
          black: ["Ke8", "Ra8"],
          unstated: ["g1"],
          claims: [
            { kind: "attackers", square: "c7", side: "b", from: [] },
            { kind: "legal", move: "Nc7+" },
          ],
        },
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
      heading: "A test to run in your next five games",
      blocks: [
        {
          kind: "list",
          ordered: true,
          items: [
            "Play five games at 15 minutes with a 10-second increment. Not blitz, or the test measures your clock.",
            "Before each of your moves, say the squares your opponent's last move newly attacks and whether anything on them is loose.",
            "When you notice a loose piece or a lined-up pair, on either side, mark the move number on paper.",
            "After each game, run the engine once and list the tactics it found for either side. Compare that list with your marks.",
            "The tactics you marked and still missed are a calculation problem. The ones you never marked are a scanning problem.",
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "A puzzle does the scanning for you by promising a tactic, so puzzle volume does not practise it. If most missed tactics sit on unmarked moves, more puzzles are unlikely to close the gap.",
          ],
        },
      ],
    },
  ],
  end: [
    {
      kind: "cta",
      target: { kind: "game", label: "Play 12 pieces, 8 seconds", pieceCount: 12, memorizeTime: 8 },
      why: "Twelve pieces in eight seconds is a fresh board with no hint about what matters, the condition a puzzle never sets.",
    },
    {
      kind: "furtherReading",
      items: [
        {
          kind: "guide",
          slug: "how-many-chess-puzzles-a-day",
          reason: "How many puzzles are still worth doing once you accept this.",
        },
        {
          kind: "guide",
          slug: "how-to-stop-blundering-in-chess",
          reason: "The precondition scan as a full pre-move checklist.",
        },
        {
          kind: "guide",
          slug: "chess-pattern-recognition-drills",
          reason: "Training the patterns that do cross over.",
        },
      ],
    },
    {
      kind: "sources",
      items: [
        {
          title: "Perception in Chess",
          note: "Supports the claim that strong players recall a briefly seen position in chunks, familiar groups of pieces stored as one unit.",
          url: "https://doi.org/10.1016/0010-0285(73)90004-2",
        },
      ],
    },
  ],
};

export default guide;
