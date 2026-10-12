import type { LearnDocument } from "../schema";

const guide: LearnDocument = {
  meta: {
    slug: "chess-visualization-exercises",
    title: "Chess Visualization Exercises: Find and Fix Your Weak Spot",
    h1: "Chess visualization exercises that find and fix your weak spot",
    description: "Chess visualization exercises built on a four-minute test that shows whether pieces vanish, drift or change identity, and a cover-and-move drill to fix it.",
    group: "visualization",
    level: "beginner",
    publishedAt: "2026-03-06T00:00:00.000Z",
    updatedAt: "2026-10-13T00:00:00.000Z",
    questions: [
      "What are the best chess visualization exercises?",
      "How do I improve my chess visualization?",
      "Why do pieces disappear when I visualize a chess line?",
      "How long does it take to improve chess visualization?",
    ],
    keywords: {
      primary: "chess visualization exercises",
      secondary: [
        "chess visualization training",
        "visualize chess moves",
        "board visualization chess",
        "cover and move drill",
        "mental chess practice",
      ],
    },
    featured: true,
  },
  intro: {
    quickAnswer: "The best chess visualization exercises train the failure you actually have. A four-minute test of four 6-piece rounds shows whether pieces vanish, drift a square or change identity in your head. Then cover a position, play a capture from memory and name every square on the file behind it before you uncover the board.",
    takeaways: [
      "Four 6-piece, 10-second rounds are a four-minute test of which way your picture breaks.",
      "The result board tells a vanished piece from a drifted one. The accuracy number cannot.",
      "Cover-and-move trains updating the picture after a capture.",
    ],
    audience: [
      "Players who calculate two moves, then look back at the board and start again.",
      "Anyone who sees the move but not the position it leaves behind.",
    ],
  },
  sections: [
    {
      id: "how-the-picture-fails",
      heading: "Why pieces vanish, drift or change in your head",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Your picture is the position you hold in your head. When a line goes wrong there, one of three things has happened, and each needs a different fix.",
          ],
        },
        {
          kind: "list",
          ordered: false,
          items: [
            "A piece vanishes. A piece outside the line, like a pawn on e4, drops out of your picture, and you calculate as if its square were empty.",
            "A piece drifts. The rook stands on d7, but your picture has it on d6, one square off.",
            "A piece changes identity. A bishop turns into a knight, or a white rook into a black one.",
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "A fourth failure is rarer. A phantom piece appears, and you calculate around a defender that does not exist.",
            "Memory Chess counts a placed piece as correct only when its square, type and colour all match the original. That strict rule lets one round tell the failures apart.",
          ],
        },
      ],
    },
    {
      id: "four-minute-check",
      heading: "The four-minute visualization check",
      summary: "Play this before any other drill, then daily as the six-week plan below sets out.",
      blocks: [
        {
          kind: "drills",
          drills: [
            {
              title: "Six pieces, ten seconds, four rounds",
              description: "Play 4 rounds of 6 pieces with 10 seconds to look. Place the pieces and submit. Before the next round, write one word for each miss: vanished, drifted, changed or phantom.",
              duration: "About 4 minutes",
              goal: "A tally that shows which failure you make most often.",
              play: { label: "Play 6 pieces, 10 seconds", pieceCount: 6, memorizeTime: 10 },
            },
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "After you submit, the board shows the pieces you placed. A green square is correct. A red square holds a piece that does not belong there. A red ring marks a square where a piece stood in the original and you did not put it back. If you left that square empty, a faded copy of the missing piece sits inside the ring.",
            "Read those marks, not the accuracy number. A phantom has no ring of its own. A seventh piece shows as one more red square, and accuracy drops ten points for it.",
          ],
        },
      ],
    },
    {
      id: "which-drill-for-which-failure",
      heading: "Which drill fixes which failure",
      blocks: [
        {
          kind: "table",
          columns: ["Failure", "What the result board shows", "What to train"],
          rows: [
            {
              label: "Vanished piece",
              cells: [
                "A ring with a faded piece inside and no stray red square near it.",
                "Look in groups. Name the king and its neighbours first, then the outliers.",
              ],
            },
            {
              label: "Drifted piece",
              cells: [
                "A red square one step from a ring that holds a faded copy of the same piece.",
                "Say each square name under your breath as you look.",
              ],
            },
            {
              label: "Changed piece",
              cells: [
                "A red square inside a ring. You found the square and lost the type or colour.",
                "Say colour and type with the square, such as white knight f3.",
              ],
            },
            {
              label: "Phantom piece",
              cells: [
                "One piece more than the position had, and ten accuracy points gone.",
                "Count your pieces before you submit. In a line, count captures as you go.",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "cover-and-move",
      heading: "The cover-and-move drill for updating the picture",
      summary: "A memory round tests holding a picture. This drill tests changing it.",
      blocks: [
        {
          kind: "board",
          position: {
            id: "cover-and-move-start",
            white: ["Kg1", "Re1", "Nf3", "e4", "f2", "g2", "h2"],
            black: ["Kg8", "Re8", "Nf6", "e5", "f7", "g7", "h7"],
            claims: [
              { kind: "pieceCount", count: 14 },
              { kind: "noCheck" },
              { kind: "attackers", square: "e5", side: "w", from: ["f3"] },
              { kind: "legal", move: "Nxe5" },
            ],
          },
          caption: "White to move: study this board, cover it, then decide whether 1.Nxe5 wins a pawn.",
        },
        {
          kind: "prose",
          paragraphs: [
            "Study the board, or set it up on a real one. White has king g1, rook e1, knight f3 and pawns on e4, f2, g2 and h2. Black has king g8, rook e8, knight f6 and pawns on e5, f7, g7 and h7.",
            "Cover the board. Now answer without uncovering it. Does 1.Nxe5 win a pawn?",
          ],
        },
        {
          kind: "list",
          ordered: true,
          items: [
            "Play 1.Nxe5 in your head. Say the e-file from top to bottom: rook e8, then e7 and e6 empty, knight e5, pawn e4, then e3 and e2 empty, rook e1.",
            "Count attackers of e5. The rook on e8 attacks it once.",
            "Count defenders of e5. The rook on e1 would, but your own pawn on e4 stands in the way. Zero.",
            "Conclude. 1.Nxe5 loses a knight for a pawn after 1...Rxe5. Uncover the board and check every square you named.",
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "Now move the white pawn from e4 to d3 and ask the same question. This time the e-file behind the knight is empty, so the rook on e1 defends e5. After 1.Nxe5 Rxe5 2.Rxe5 White has won a rook and a pawn for a knight, so Black should not recapture, and 1.Nxe5 wins a clean pawn.",
            "One pawn moved one square and the answer flipped. The e4 pawn is easy to forget because it never moves in the line. Before you judge a capture, say the whole file or diagonal behind it, all the way to the edge.",
            "Do two positions of your own each day. Cover a puzzle you solved yesterday and play the solution in your head. Say where every moved piece now stands and which pieces are gone. Then uncover, play the solution out on the board and check each square you named. It worked if every one matches.",
          ],
        },
      ],
      facts: [
        {
          id: "cover-and-move",
          white: ["Kg1", "Re1", "Nf3", "e4", "f2", "g2", "h2"],
          black: ["Kg8", "Re8", "Nf6", "e5", "f7", "g7", "h7"],
          line: ["Nxe5"],
          claims: [
            { kind: "occupant", square: "e8", piece: "br" },
            { kind: "occupant", square: "e7", piece: null },
            { kind: "occupant", square: "e6", piece: null },
            { kind: "occupant", square: "e5", piece: "wn" },
            { kind: "occupant", square: "e4", piece: "wp" },
            { kind: "occupant", square: "e3", piece: null },
            { kind: "occupant", square: "e2", piece: null },
            { kind: "occupant", square: "e1", piece: "wr" },
            { kind: "attackers", square: "e5", side: "b", from: ["e8"] },
            { kind: "attackers", square: "e5", side: "w", from: [] },
            { kind: "legal", move: "Rxe5" },
          ],
        },
        {
          id: "cover-and-move-pawn-on-d3",
          white: ["Kg1", "Re1", "Nf3", "d3", "f2", "g2", "h2"],
          black: ["Kg8", "Re8", "Nf6", "e5", "f7", "g7", "h7"],
          line: ["Nxe5"],
          claims: [{ kind: "attackers", square: "e5", side: "w", from: ["e1"] }, { kind: "noMateInOne" }],
        },
        {
          id: "cover-and-move-pawn-on-d3-recaptured",
          white: ["Kg1", "Re1", "Nf3", "d3", "f2", "g2", "h2"],
          black: ["Kg8", "Re8", "Nf6", "e5", "f7", "g7", "h7"],
          line: ["Nxe5", "Rxe5", "Rxe5"],
          claims: [{ kind: "material", white: "kppppr", black: "knppp" }, { kind: "noMateInOne" }],
        },
      ],
    },
    {
      id: "six-week-progression",
      heading: "Six weeks with one number to watch",
      blocks: [
        {
          kind: "plan",
          steps: [
            {
              label: "Weeks 1 and 2",
              duration: "8 minutes a day",
              detail: "The four-minute check daily, then two cover-and-move positions, each with a single capture. The number to watch is perfect rounds out of four.",
            },
            {
              label: "Weeks 3 and 4",
              duration: "10 minutes a day",
              detail: "Keep the check. Extend cover-and-move to two moves for each side, and end by saying the file or diagonal behind the last capture. Open Recall by piece type in your Lab record. A type that stays low is the one your picture loses.",
            },
            {
              label: "Weeks 5 and 6",
              duration: "12 minutes a day",
              detail: "If three of your last five checks in week 4 had three perfect rounds out of four, the picture holds at six pieces. Move the check to 8 pieces with 10 seconds and restart cover-and-move from one capture. Otherwise, repeat weeks 3 and 4.",
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
      why: "Four rounds at six pieces show whether your pieces vanish, drift a square or change identity on the way back.",
    },
    {
      kind: "faq",
      items: [
        {
          question: "Why not just play more rounds until accuracy goes up?",
          answer: "Accuracy hides which failure you have. Two players at 67% on six pieces can have opposite problems. One drops the outliers and needs to look in groups. The other keeps every square, swaps the pieces and needs to name colour and type.",
        },
        {
          question: "Should I test visualization with more pieces?",
          answer: "Not until six pieces are easy. On a board with many misses, rings and red squares crowd together and you cannot tell which failure caused which. Move to eight once three of your last five checks have three perfect rounds out of four. The 12-piece, 8-second Hard preset comes after that.",
        },
        {
          question: "Can I do visualization exercises without a chess board?",
          answer: "Yes. Cover-and-move works with any diagram you can hide, on paper or on a screen. Setting the pieces up by hand helps a little, since placing the e4 pawn yourself makes it harder to forget.",
        },
      ],
    },
    {
      kind: "furtherReading",
      items: [
        {
          kind: "guide",
          slug: "blindfold-chess-training-for-beginners",
          reason: "When a covered board feels easy, the next step is a whole game without one.",
        },
        {
          kind: "guide",
          slug: "chess-calculation-exercises-for-beginners",
          reason: "Uses the cover-and-move habit on longer lines.",
        },
        {
          kind: "guide",
          slug: "how-to-see-the-whole-board-in-chess",
          reason: "Traces every bishop, rook and queen line to the edge, the habit cover-and-move relies on.",
        },
        {
          kind: "guide",
          slug: "chess-memory-training",
          reason: "The piece-count ladder to climb once six pieces hold three rounds out of four.",
        },
      ],
    },
  ],
};

export default guide;
