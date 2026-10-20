import type { LearnDocument } from "../schema";

const guide: LearnDocument = {
  meta: {
    slug: "how-to-see-the-whole-board-in-chess",
    title: "How to See the Whole Board in Chess",
    h1: "How to see the whole board in chess",
    description: "Name every piece on the four edges before each move, and trace enemy lines after a capture or pawn move. That is how to see the whole board in chess.",
    group: "board-vision",
    level: "beginner",
    publishedAt: "2026-03-24T00:00:00.000Z",
    updatedAt: "2026-10-20T00:00:00.000Z",
    questions: [
      "How do I see the whole board?",
      "How do I stop tunnel vision in chess?",
      "Why do I miss long-range bishops and rooks?",
    ],
    keywords: {
      primary: "how to see the whole board in chess",
      secondary: [
        "chess tunnel vision",
        "board awareness chess",
        "chess scanning habit",
        "long range pieces chess",
        "how to notice threats in chess",
      ],
    },
  },
  intro: {
    quickAnswer: "To learn how to see the whole board in chess, run a five-step sweep from the edges inward before you choose a move. Name every piece on the a-file, h-file, first rank and eighth rank. Then trace each enemy bishop, rook and queen to the edge, and check the knights and your own long-range pieces.",
    takeaways: [
      "A long-range piece wins material without moving. When a pawn steps off its line, your eyes follow the pawn and miss the line it opened.",
      "Trace every line to the edge of the board, because the first piece on the line may be yours and pinned.",
      "Start the sweep at the edges, because a look that works outward from your own move reaches them last.",
    ],
    audience: [
      "Players who lose material to a bishop or rook that had not moved for many moves.",
      "Anyone whose blunders happen on the side of the board away from the fight.",
    ],
  },
  sections: [
    {
      id: "bishop-on-a2",
      heading: "Why you miss long-range bishops and rooks",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Set this up with Black to move. White has Kg1, Ra1, Rf1, Ba2, Nc3, Ng5 and pawns on a3, b2, c2, f2, g2 and h2. Black has Kg8, Ra8, Rd8, Bc8, Nf6 and pawns on a7, b7, c7, e6, f7, g7 and h7.",
            "The bishop on a2 looks down b3, c4, d5, e6, f7 and g8. Black's pawns on e6 and f7 stand in the way, and Black's king waits at the end.",
            "Push ...e5 for space in the centre, and Bxf7+ follows. The king cannot take back, because the knight on g5 also covers f7, so White wins a pawn with check.",
          ],
        },
        {
          kind: "board",
          position: {
            id: "bishop-a2-after-e5",
            white: ["Kg1", "Ra1", "Rf1", "Ba2", "Nc3", "Ng5", "a3", "b2", "c2", "f2", "g2", "h2"],
            black: ["Kg8", "Ra8", "Rd8", "Bc8", "Nf6", "a7", "b7", "c7", "e6", "f7", "g7", "h7"],
            toMove: "b",
            line: ["e5"],
            claims: [
              { kind: "attacks", from: "a2", squares: ["f7"] },
              { kind: "attacks", from: "g5", squares: ["f7"] },
            ],
          },
          arrows: [{ from: "a2", to: "f7", kind: "attack" }, { from: "g5", to: "f7", kind: "attack" }],
          marks: [{ square: "f7", kind: "ring" }],
          caption: "After ...e5 the bishop on a2 and the knight on g5 both hit f7, though the bishop did not move.",
        },
        {
          kind: "prose",
          paragraphs: [
            "Nxf7 is stronger still. The king cannot take the knight either, because the bishop now covers f7, and the knight attacks the rook on d8.",
            "Nothing about the bishop changed. Only a Black pawn moved. This is tunnel vision. Your eyes follow the pawn to e5 and the space it gains, so a bishop that has stood still for ten moves drops out of the picture.",
            "Rooks do the same more quietly. A rook can sit on h1 all game until the h-pawns are traded, and then it owns an open file without having moved.",
          ],
        },
      ],
      facts: [
        {
          id: "bishop-a2",
          white: ["Kg1", "Ra1", "Rf1", "Ba2", "Nc3", "Ng5", "a3", "b2", "c2", "f2", "g2", "h2"],
          black: ["Kg8", "Ra8", "Rd8", "Bc8", "Nf6", "a7", "b7", "c7", "e6", "f7", "g7", "h7"],
          toMove: "b",
          claims: [
            { kind: "pieceCount", count: 24 },
            { kind: "noCheck" },
            { kind: "occupant", square: "b3", piece: null },
            { kind: "occupant", square: "c4", piece: null },
            { kind: "occupant", square: "d5", piece: null },
            { kind: "occupant", square: "e6", piece: "bp" },
            { kind: "occupant", square: "f7", piece: "bp" },
            { kind: "occupant", square: "g8", piece: "bk" },
            { kind: "legal", move: "e5" },
          ],
        },
        {
          id: "bishop-a2-after-bxf7",
          white: ["Kg1", "Ra1", "Rf1", "Ba2", "Nc3", "Ng5", "a3", "b2", "c2", "f2", "g2", "h2"],
          black: ["Kg8", "Ra8", "Rd8", "Bc8", "Nf6", "a7", "b7", "c7", "e6", "f7", "g7", "h7"],
          toMove: "b",
          line: ["e5", "Bxf7+"],
          claims: [
            { kind: "check" },
            { kind: "illegal", move: "Kxf7" },
            { kind: "attacks", from: "g5", squares: ["f7"] },
            { kind: "attackers", square: "f7", side: "b", from: ["g8"] },
            { kind: "noMateInOne" },
          ],
        },
        {
          id: "bishop-a2-after-nxf7",
          white: ["Kg1", "Ra1", "Rf1", "Ba2", "Nc3", "Ng5", "a3", "b2", "c2", "f2", "g2", "h2"],
          black: ["Kg8", "Ra8", "Rd8", "Bc8", "Nf6", "a7", "b7", "c7", "e6", "f7", "g7", "h7"],
          toMove: "b",
          line: ["e5", "Nxf7"],
          claims: [
            { kind: "illegal", move: "Kxf7" },
            { kind: "attackers", square: "f7", side: "w", from: ["a2"] },
            { kind: "attacks", from: "f7", squares: ["d8"] },
            { kind: "noMateInOne" },
          ],
        },
      ],
    },
    {
      id: "edge-sweep",
      heading: "How to sweep the board from the edges inward",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "The sweep is the cure for tunnel vision. The order matters more than the speed. Run these five steps before you choose a move.",
          ],
        },
        {
          kind: "list",
          ordered: true,
          items: [
            "The edges. Name every piece on the a-file, the h-file, the first rank and the eighth rank, for both sides. Rooks still on their first squares and bishops pulled back to the rim stand here.",
            "Every enemy bishop, rook and queen. Follow each line through every piece on it to the edge of the board, and say whose piece each one is.",
            "Every enemy knight. Name the squares it reaches, because a sweep along lines never touches them.",
            "Your own bishops, rooks and queen, traced the same way.",
            "Last, your own move. Check the square it lands on and any line it opens by leaving its old square.",
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "Run it on the bishop position as Black. Step one finds the bishop on a2. Step two follows it through e6 and f7 to g8 and names each piece it passes, your pawn, your other pawn and your king. Now ...e5 reads as a move that leaves one pawn between that bishop and your king.",
          ],
        },
      ],
    },
    {
      id: "last-square",
      heading: "Trace a line to the edge, not to the first piece on it",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "One slip is to stop a trace at the first piece on the line. If that piece is yours, you have not found a blocker. You may have found a pin.",
            "Put a White rook on e1, a Black knight on e5 and the Black king on e8, with the squares between them empty. The knight cannot move at all.",
            "So as Black, say that the rook sees e8, never that the rook is blocked by your knight. The first version announces the pin, and the second one hides it.",
          ],
        },
      ],
      facts: [
        {
          id: "rook-pin",
          white: ["Re1", "Kg1"],
          black: ["Ne5", "Ke8"],
          toMove: "b",
          unstated: ["g1"],
          claims: [{ kind: "immobile", square: "e5" }],
        },
      ],
    },
    {
      id: "generated-positions",
      heading: "Why a generated 12-piece position trains the sweep",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "A game position clusters. Pawns lock in the centre, pieces gather near the kings, and a corner can stay empty for twenty moves. That clustering is why you need the sweep.",
            "Memory Chess builds a fresh position for every round, with no plan behind it. The two kings go on random squares that are never adjacent. Every other piece goes on a random empty square, within the rules of a legal position.",
            "Nothing pulls the pieces toward the centre or the kings, so a 12-piece board can have a piece in every corner. Reading the edges first and the middle last is the sweep, done from memory.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Edge-first recall round",
              description: "Play 3 rounds of 12 pieces with 8 seconds to look. During the look, read the edges first, then the middle. Place the edge pieces first. The result board rings each square you missed. You pass when no ring lands on an edge square.",
              duration: "3 rounds, about 5 minutes",
              goal: "Hold the edges and the middle at once instead of one cluster.",
              play: { label: "Play 12 pieces, 8 seconds", pieceCount: 12, memorizeTime: 8 },
            },
            {
              title: "Edge inventory",
              description: "Open an annotated game at any middlegame diagram. List every piece on the four edges. For each bishop, rook and queen among them, trace its lines to the edge and write every piece they pass. Then check in a second pass. Run your finger from a1 to h1, h8, a8 and back to a1, ticking each piece on your list, and touch every square of each trace. You pass when the second pass adds nothing.",
              duration: "4 minutes",
              goal: "Make the pieces you usually skip the first ones you list.",
            },
          ],
        },
      ],
    },
    {
      id: "far-corner-glance",
      heading: "A last glance at the far corner before you let go",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "The sweep opens your think. The table covers the moments around it.",
          ],
        },
        {
          kind: "table",
          columns: ["Moment", "Eyes on the fight", "Eyes on the whole board"],
          rows: [
            {
              label: "Opponent's last move",
              cells: [
                "You look at the piece that moved and the square it reached.",
                "You look at the line it opened behind it and the square it stopped guarding.",
              ],
            },
            {
              label: "After a trade",
              cells: [
                "You count the material.",
                "You re-trace every line the trade opened, for both sides.",
              ],
            },
            {
              label: "Before you release a piece",
              cells: [
                "You check the squares next to your move.",
                "You check the corner farthest from your move.",
              ],
            },
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "The last thing your eyes touch before a move is the far corner, and the bishop on a2 is the reason why.",
          ],
        },
      ],
    },
  ],
  end: [
    {
      kind: "cta",
      target: {
        kind: "game",
        label: "Play 12 pieces with 8 seconds to look",
        pieceCount: 12,
        memorizeTime: 8,
      },
      why: "Twelve randomly placed pieces can land on any file or rank, so the edges get tested as hard as the middle.",
    },
    {
      kind: "faq",
      items: [
        {
          question: "When should I run the full sweep?",
          answer: "Run it in full after any pawn move, capture or trade, because those are the moves that open lines. On a quiet move where no blocker moved, check the four edges and the line behind the piece that just moved, then play.",
        },
        {
          question: "What if the sweep makes me too slow?",
          answer: "Keep the order and shorten each step. When nothing on an edge has changed since your last move, a glance confirms it and you move on. Practise the order in slow games and Memory Chess rounds first, so it runs on its own before blitz.",
        },
      ],
    },
    {
      kind: "furtherReading",
      items: [
        {
          kind: "guide",
          slug: "chess-visualization-exercises",
          reason: "Trains holding a position in your head, which the edge-first recall round asks for at speed.",
        },
        {
          kind: "guide",
          slug: "chess-coordinates-practice",
          reason: "Drills for naming a square without counting, so naming each square along a line does not slow the sweep.",
        },
        {
          kind: "guide",
          slug: "how-to-stop-blundering-in-chess",
          reason: "Covers the phantom defender and the loose piece, the other ways your picture of the board goes wrong.",
        },
      ],
    },
  ],
};

export default guide;
