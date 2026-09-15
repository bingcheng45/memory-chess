import type { LearnPosition } from "../positions";
import type { LearnGuide } from "../schema";

const guide: LearnGuide = {
  slug: "chess-pattern-recognition-drills",
  goal: "memory",
  title: "Chess Pattern Recognition Drills: Four Shapes to Rebuild From Memory",
  h1: "Pattern recognition drills: learn four shapes by rebuilding them",
  description:
    "Four tactical shapes with their exact squares, a rebuild routine that makes each one stick, and what a random Memory Chess position can and cannot teach about patterns.",
  primaryKeyword: "chess pattern recognition drills",
  secondaryKeywords: [
    "pattern recognition chess",
    "chess motifs training",
    "knight fork pattern",
    "back rank mate pattern",
    "chess chunking",
  ],
  ctaLabel: "Open the 12-piece, 8-second round",
  quickAnswer:
    "Learn a pattern as a shape with squares, not as a name. Set it up, clear the board, rebuild it, then shift it one file and check whether the idea still works.",
  keyTakeaways: [
    "A fork on c7 is three squares, e8, a8 and c7, plus one condition: nothing black can take on c7.",
    "Rebuilding a shape from an empty board is what turns a puzzle you solved into a shape you notice.",
    "Memory Chess positions are random, so they train reading clusters fast, not tactics. Use them for the reading.",
  ],
  whoThisIsFor: [
    "Players with a decent puzzle rating who still walk into forks in their own games.",
    "Beginners who know the words pin, fork and skewer and could not set one up.",
    "Anyone who reads a 12-piece board one piece at a time.",
  ],
  timeToRead: "8 min read",
  difficulty: "Beginner",
  publishedAt: "2026-03-24T00:00:00.000Z",
  updatedAt: "2026-09-15T00:00:00.000Z",
  sections: [
    {
      id: "shape-plus-condition",
      title: "A pattern is a shape plus one condition",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Start with the knight fork on c7. Black king on e8, black rook on a8, and a white knight lands on c7 and hits both.",
            "That is the shape. The condition is that nothing black can capture on c7. A black queen or bishop on d8 kills the fork, and so does a black knight on b5 or e6.",
            "Puzzles hand you the shape and guarantee the condition. Games do neither, which is why a puzzle rating and a habit of noticing forks are different things.",
            "So a pattern drill has two halves. Rebuild the shape until you can place it from memory, then break the condition on purpose and watch the fork fail.",
          ],
        },
      ],
    },
    {
      id: "four-shapes-with-squares",
      title: "Four shapes, with their squares",
      blocks: [
        {
          kind: "steps",
          ordered: false,
          items: [
            "Knight fork on c7. Black king e8, black rook a8, white knight on d5 or b5 ready to jump. Condition: no black piece guards c7.",
            "Back-rank mate. Black king g8, black pawns f7, g7 and h7, white rook on e1 with the e-file open. Condition: no black piece can capture on e8 or block the eighth rank.",
            "Bishop pin on b5. Black king e8, black knight c6, white bishop b5. Condition: d7 is empty, so the knight cannot move without exposing the king along the diagonal.",
            "Smothered mate. Black king h8, black rook g8, black pawns g7 and h7, white knight lands on f7. Condition: nothing black covers f7. The rook and pawns take the king's flight squares themselves.",
          ],
        },
        {
          kind: "paragraphs",
          paragraphs: [
            "Four is enough for a month. Each one is a cluster of three to five pieces, and each has exactly one condition to check.",
            "Notice that the condition is always about a piece that is not part of the shape. That piece is easy to skip if you mostly solve puzzles, because a puzzle already promises the tactic works.",
          ],
        },
      ],
    },
    {
      id: "rebuild-shift-break",
      title: "Rebuild it, shift it, break it",
      summary: "The routine for one shape, about 6 minutes at a real board.",
      blocks: [
        {
          kind: "steps",
          ordered: true,
          items: [
            "Set the shape up from the list above and look at it for ten seconds. Say the squares out loud: e8, a8, d5, c7.",
            "Clear the board completely, kings included, and set it up again from memory. Check against the list. A piece on the wrong square is wrong, the same rule the game uses.",
            "Shift the whole shape one file to the right: king f8, rook b8, knight e5, fork square d7. Does the knight still hit both? It does, and saying why makes the geometry yours.",
            "Break the condition. Add a black bishop on c8 and ask whether the fork still works. The bishop takes on d7, so it does not, and now you know what to look for in a game.",
            "Only then open your last three games and look for the shape, even where it never happened. A knight two jumps from a fork square is the shape in its early form.",
          ],
        },
      ],
    },
    {
      id: "random-boards-and-clusters",
      title: "What a random 12-piece board teaches, and what it cannot",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Memory Chess positions are generated fresh for each round and are not taken from games. A round is not built to show you a back-rank mate, so it will not teach you that pattern.",
            "What it trains is the act underneath pattern recognition, reading a cluster of pieces as one unit. Twenty pieces in five seconds is a quarter of a second per piece, so reading clusters gets you further than reading square by square.",
            "The generator draws piece types in the proportions a real set holds: eight pawns, two knights, two bishops, two rooks and one queen per side. Pawns are the most common piece you see and queens the rarest.",
            "That is a clue you can use. On a 12-piece board the ten pieces beyond the kings are split five and five, and about half of them are pawns. Count the pawn chains first, then the odd pieces.",
            "Two more rules shrink the search. A side's two bishops never share a square colour, and no pawn ever stands on the first or eighth rank.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Chains first",
              description:
                "3 rounds of 12 pieces, 8 seconds, about 5 minutes. Kings first, then each pawn chain as a single shape, then whatever is left. Say the chains as you place them, f2 g3, e6 f7.",
              duration: "About 5 minutes",
              goal: "Every pawn on its square. Drop a rook before you drop a chain.",
              ctaLabel: "Start 12 pieces, 8 seconds",
              setup: { pieceCount: 12, memorizeTime: 8 },
            },
            {
              title: "The quarter-second board",
              description:
                "2 rounds of 20 pieces, 5 seconds, about 4 minutes. You will not get them all. The point is to catch the moment you stop reading pieces and start reading shapes.",
              duration: "About 4 minutes",
              goal: "At least 50 percent on the second round, which the result screen calls Good Effort or better.",
              ctaLabel: "Try 20 pieces, 5 seconds",
              setup: { pieceCount: 20, memorizeTime: 5 },
            },
          ],
        },
      ],
    },
    {
      id: "recognition-over-search",
      title: "Recognition does more of the work than search",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Gobet and Simon compared Kasparov's results in simultaneous displays, where he had a fraction of his usual time per move, with his results in normal games. The drop was small.",
            "They read that as evidence that recognising positions, rather than searching deeply, carries most of a strong player's strength.",
            "For a beginner the lesson is not to skip calculation. It is that the shapes you can rebuild from memory are the ones you notice in time to calculate at all.",
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: "Is pattern recognition the same as memorising puzzles?",
      answer:
        "No. A memorised puzzle is one position. A pattern is a shape that survives being shifted a file, plus a condition you check every time you see it.",
    },
    {
      question: "Can Memory Chess show me real tactical patterns?",
      answer:
        "No. Its positions are random and made fresh every round. Use it to practise reading clusters quickly, and learn the shapes themselves at a board.",
    },
    {
      question: "How many patterns should I learn at once?",
      answer:
        "Four, for a month. Add a fifth when you have found each of the four in your own games.",
    },
  ],
  relatedArticles: [
    {
      slug: "chess-memory-training",
      reason: "The ladder that gets you to 12 pieces before you try to read them as chunks.",
    },
    {
      slug: "why-puzzle-rating-doesnt-transfer-to-games",
      reason: "Why the shape shows up in puzzles and not in your games.",
    },
  ],
  sources: [
    {
      title:
        "The Roles of Recognition Processes and Look-Ahead Search in Time-Constrained Expert Problem Solving: Evidence From Grand-Master-Level Chess",
      url: "https://doi.org/10.1111/j.1467-9280.1996.tb00666.x",
      note: "Supports the claim that Kasparov's results with far less time per move in simultaneous displays fell only slightly, read as evidence for recognition over search.",
    },
  ],
};

const guardOfC7 = (guard: string): LearnPosition => ({
  id: `c7-guarded-by-${guard}`,
  sectionId: "shape-plus-condition",
  white: ["Kg1"],
  black: ["Ke8", "Ra8", guard],
  unstated: ["g1"],
  claims: [{ kind: "attacks", from: guard.slice(-2), squares: ["c7"] }],
});

export const positions: LearnPosition[] = [
  {
    id: "fork-from-d5",
    sectionId: "four-shapes-with-squares",
    white: ["Kg1", "Nd5"],
    black: ["Ke8", "Ra8"],
    unstated: ["g1"],
    claims: [{ kind: "attackers", square: "c7", side: "b", from: [] }],
  },
  {
    id: "fork-from-d5-played",
    sectionId: "four-shapes-with-squares",
    white: ["Kg1", "Nd5"],
    black: ["Ke8", "Ra8"],
    unstated: ["g1"],
    line: ["Nc7+"],
    claims: [
      { kind: "check" },
      { kind: "attacks", from: "c7", squares: ["a8", "e8"] },
    ],
  },
  {
    id: "fork-from-b5-played",
    sectionId: "four-shapes-with-squares",
    white: ["Kg1", "Nb5"],
    black: ["Ke8", "Ra8"],
    unstated: ["g1"],
    line: ["Nc7+"],
    claims: [
      { kind: "check" },
      { kind: "attacks", from: "c7", squares: ["a8", "e8"] },
    ],
  },
  guardOfC7("Qd8"),
  guardOfC7("Bd8"),
  guardOfC7("Nb5"),
  guardOfC7("Ne6"),
  {
    id: "back-rank-mate",
    sectionId: "four-shapes-with-squares",
    white: ["Kh1", "Re1"],
    black: ["Kg8", "f7", "g7", "h7"],
    unstated: ["h1"],
    line: ["Re8#"],
    claims: [{ kind: "mate" }],
  },
  {
    id: "bishop-pin",
    sectionId: "four-shapes-with-squares",
    white: ["Kg1", "Bb5"],
    black: ["Ke8", "Nc6"],
    toMove: "b",
    unstated: ["g1"],
    claims: [
      { kind: "occupant", square: "d7", piece: null },
      { kind: "immobile", square: "c6" },
    ],
  },
  {
    id: "smothered-mate",
    sectionId: "four-shapes-with-squares",
    white: ["Kg1", "Ng5"],
    black: ["Kh8", "Rg8", "g7", "h7"],
    unstated: ["g1", "g5"],
    line: ["Nf7#"],
    claims: [
      { kind: "mate" },
      { kind: "attackers", square: "f7", side: "b", from: [] },
    ],
  },
  {
    id: "fork-shifted",
    sectionId: "rebuild-shift-break",
    white: ["Kg1", "Ne5"],
    black: ["Kf8", "Rb8"],
    unstated: ["g1"],
    line: ["Nd7+"],
    claims: [
      { kind: "check" },
      { kind: "attacks", from: "d7", squares: ["b8", "f8"] },
    ],
  },
  {
    id: "fork-shifted-broken",
    sectionId: "rebuild-shift-break",
    white: ["Kg1", "Ne5"],
    black: ["Kf8", "Rb8", "Bc8"],
    unstated: ["g1"],
    claims: [{ kind: "attacks", from: "c8", squares: ["d7"] }],
  },
];

export default guide;
