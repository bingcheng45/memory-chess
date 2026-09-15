import type { LearnPosition, PieceToken } from "../positions";
import type { LearnGuide } from "../schema";

const guide: LearnGuide = {
  slug: "how-to-see-the-whole-board-in-chess",
  goal: "visualization",
  title: "How to See the Whole Board in Chess",
  h1: "How to see the whole chess board",
  description: "Why a bishop that never moved still wins material, a sweep that starts at the edges, and a 12-piece round with no clusters to lean on.",
  primaryKeyword: "how to see the whole board in chess",
  secondaryKeywords: [
    "chess tunnel vision",
    "board awareness chess",
    "chess scanning habit",
    "long range pieces chess",
    "how to notice threats in chess",
  ],
  ctaLabel: "Play 12 pieces with 8 seconds to look",
  quickAnswer: "Sweep from the edges inward before you look at your own move. Take the long diagonals, then the edge files and ranks, then trace every enemy bishop, rook and queen to its last square.",
  keyTakeaways: [
    "The eye follows the piece that moved, and a long-range piece does its damage by standing still while a blocker moves.",
    "Trace every line to the last square it reaches, because the first piece on the line may be yours and pinned.",
    "A Memory Chess position is generated with no plan behind it, so it offers none of the clusters a game position lets you lean on.",
  ],
  whoThisIsFor: [
    "Players who lose material to a bishop or rook that had not moved for many moves.",
    "Anyone whose blunders happen on the side of the board away from the fight.",
    "Beginners who look at their own move first and at the far corners never.",
  ],
  timeToRead: "6 min read",
  difficulty: "Beginner",
  publishedAt: "2026-03-24T00:00:00.000Z",
  updatedAt: "2026-09-15T00:00:00.000Z",
  sections: [
    {
      id: "bishop-on-a2",
      title: "The bishop on a2 that nobody was watching",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Set this up with Black to move. White has Kg1, Ra1, Rf1, Ba2, Nc3, Ng5 and pawns on a3, b2, c2, f2, g2 and h2.",
            "Black has Kg8, Ra8, Rd8, Bc8, Nf6 and pawns on a7, b7, c7, e6, f7, g7 and h7.",
            "The pawn on e6 is the only piece between the bishop on a2 and f7. The diagonal runs a2, b3, c4, d5, e6 and f7.",
            "Push ...e5 for space in the centre, and Bxf7+ follows. The king cannot take back, because the knight on g5 also covers f7, so White wins a pawn with check.",
            "Nothing about the bishop changed. A Black pawn moved, and the eye went with it. Long-range pieces win material by standing still while a blocker walks away.",
            "Rooks do the same more quietly. A rook can sit on h1 all game until the h-pawns are traded, and then it owns an open file without having moved.",
          ],
        },
      ],
    },
    {
      id: "edge-sweep",
      title: "The four-corner sweep, in a fixed order",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "The order matters more than the speed. The sweep starts at the edges because a look that works outward from your own move reaches them last.",
          ],
        },
        {
          kind: "steps",
          ordered: true,
          items: [
            "The two long diagonals, a1 to h8 and h1 to a8. Find any bishop or queen on them and name what blocks each one.",
            "The a-file, the h-file, the first rank and the eighth rank. Find any rook or queen on them and trace it to the far end.",
            "Every enemy bishop, rook and queen, followed to the edge of the board. Say whose piece each blocker is.",
            "Every enemy knight. Name the squares it reaches, because a sweep along lines never touches them.",
            "Last, your own move, the square it lands on and the square it leaves behind.",
          ],
        },
        {
          kind: "paragraphs",
          paragraphs: [
            "Starting at the edges feels backwards. Start from your own move instead, and the far corner becomes the last place you look and the first you skip on a low clock.",
          ],
        },
      ],
    },
    {
      id: "last-square",
      title: "Name the last square a line reaches, not the first piece on it",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "One slip is to stop a trace at the first piece on the line. If that piece is yours, you have not found a blocker. You may have found a pin.",
            "Put a White rook on e1, a Black knight on e5 and the Black king on e8, with the squares between them empty. The knight cannot move at all.",
            "So say “that rook sees e8” rather than “that rook is blocked by my knight”. The first version announces the pin, and the second one hides it.",
          ],
        },
      ],
    },
    {
      id: "generated-positions",
      title: "Why a generated 12-piece position trains the sweep",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "A game position clusters. Pawns lock in the centre, pieces gather near the kings, and a corner can stay empty for twenty moves.",
            "That clustering is why the sweep is needed. It is also why your own games are a poor place to practise the sweep.",
            "Memory Chess builds a fresh position for every round, with no plan behind it. The two kings go on random squares that are never adjacent.",
            "Every other piece goes on a random empty square, limited by the rules of a legal position. No pawn stands on the first or eighth rank, and a side's two bishops stand on opposite colours.",
            "Nothing in the generator pulls pieces toward the centre or toward the kings. Twelve pieces in eight seconds is one of the game's four presets, and at that size no single cluster holds the position.",
            "So you read the board in zones and carry every zone to the empty board. That is the sweep, done from memory.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Zone recall round",
              description: "Play 3 rounds of 12 pieces with 8 seconds to look. Read the board in three zones, files a to c, d and e, then f to h. Place the pieces zone by zone.",
              duration: "3 rounds, about 5 minutes",
              goal: "Hold both wings at once instead of one cluster.",
              ctaLabel: "Play 12 pieces, 8 seconds",
              setup: {
                pieceCount: 12,
                memorizeTime: 8,
              },
            },
            {
              title: "Edge inventory",
              description: "Open an annotated game at any middlegame diagram. List every piece on the a-file, the h-file, the first rank and the eighth rank, and write the last square each one reaches.",
              duration: "4 minutes",
              goal: "Make the pieces you usually skip the first ones you list.",
              ctaLabel: "List the edge pieces",
            },
          ],
        },
      ],
    },
    {
      id: "far-corner-glance",
      title: "A last glance at the far corner before you let go",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "The sweep opens your think. This table covers its close, the last look before you release the piece.",
          ],
        },
        {
          kind: "comparison",
          columns: ["Moment", "Eyes on the fight", "Eyes on the whole board"],
          rows: [
            {
              label: "Opponent's last move",
              struggling: "You look at the piece that moved and the square it reached.",
              stronger: "You look at the line it opened behind it and the square it stopped guarding.",
            },
            {
              label: "Before you release a piece",
              struggling: "You check the squares next to your move.",
              stronger: "You check the corner farthest from your move.",
            },
            {
              label: "After a trade",
              struggling: "You count the material.",
              stronger: "You re-trace every line the trade opened, for both sides.",
            },
          ],
        },
        {
          kind: "paragraphs",
          paragraphs: [
            "The habit is small. The last thing your eyes touch before a move is the far corner, and the bishop on a2 is the reason why.",
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: "Do I have to sweep on every move?",
      answer: "Run the full sweep whenever a pawn moves or a piece is traded, because those moves open lines. On other moves, check the edges and the last move.",
    },
    {
      question: "What if the sweep makes me too slow?",
      answer: "Keep the order and shorten each step. When nothing on an edge has changed since your last move, a glance confirms it and you move on.",
    },
  ],
  relatedArticles: [
    {
      slug: "chess-visualization-exercises",
      reason: "Trains holding a position in your head, which the zone recall round asks for at speed.",
    },
    {
      slug: "chess-coordinates-practice",
      reason: "Makes square names automatic, so naming the last square of a line stops slowing the sweep.",
    },
    {
      slug: "how-to-stop-blundering-in-chess",
      reason: "Covers the phantom defender and the loose piece, the other ways your picture of the board goes wrong.",
    },
  ],
  sources: [],
};

const BISHOP_A2_WHITE: PieceToken[] = ["Kg1", "Ra1", "Rf1", "Ba2", "Nc3", "Ng5", "a3", "b2", "c2", "f2", "g2", "h2"];
const BISHOP_A2_BLACK: PieceToken[] = ["Kg8", "Ra8", "Rd8", "Bc8", "Nf6", "a7", "b7", "c7", "e6", "f7", "g7", "h7"];

export const positions: LearnPosition[] = [
  {
    id: "bishop-a2",
    sectionId: "bishop-on-a2",
    white: BISHOP_A2_WHITE,
    black: BISHOP_A2_BLACK,
    toMove: "b",
    claims: [
      { kind: "pieceCount", count: 24 },
      { kind: "noCheck" },
      { kind: "occupant", square: "b3", piece: null },
      { kind: "occupant", square: "c4", piece: null },
      { kind: "occupant", square: "d5", piece: null },
      { kind: "occupant", square: "e6", piece: "bp" },
      { kind: "legal", move: "e5" },
    ],
  },
  {
    id: "bishop-a2-after-e5",
    sectionId: "bishop-on-a2",
    white: BISHOP_A2_WHITE,
    black: BISHOP_A2_BLACK,
    toMove: "b",
    line: ["e5"],
    claims: [{ kind: "attacks", from: "a2", squares: ["f7"] }],
  },
  {
    id: "bishop-a2-after-bxf7",
    sectionId: "bishop-on-a2",
    white: BISHOP_A2_WHITE,
    black: BISHOP_A2_BLACK,
    toMove: "b",
    line: ["e5", "Bxf7+"],
    claims: [
      { kind: "check" },
      { kind: "illegal", move: "Kxf7" },
      { kind: "attacks", from: "g5", squares: ["f7"] },
      { kind: "attackers", square: "f7", side: "b", from: ["g8"] },
    ],
  },
  {
    id: "rook-pin",
    sectionId: "last-square",
    white: ["Re1", "Kg1"],
    black: ["Ne5", "Ke8"],
    toMove: "b",
    unstated: ["g1"],
    claims: [{ kind: "immobile", square: "e5" }],
  },
];

export default guide;
