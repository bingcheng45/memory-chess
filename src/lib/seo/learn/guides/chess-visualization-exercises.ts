import type { LearnDocument } from "../schema";

const guide: LearnDocument = {
  meta: {
    slug: "chess-visualization-exercises",
    title: "Chess Visualization Training: 2 Exercises",
    h1: "Chess visualization exercises for when the picture fades two moves in",
    description: "Visualization drills for players who lose the position two moves into a line, with a four-minute check for pieces that vanish, drift or change identity.",
    group: "visualization",
    level: "beginner",
    publishedAt: "2026-03-06T00:00:00.000Z",
    updatedAt: "2026-09-15T00:00:00.000Z",
    questions: [
      "How do I improve chess visualization?",
      "Why does the position fade two moves into a line?",
      "What is the cover-and-move drill?",
      "How long does visualization training take?",
    ],
    keywords: {
      primary: "chess visualization exercises",
      secondary: [
        "chess visualization training",
        "calculate moves ahead",
        "board visualization chess",
        "cover and move drill",
        "mental chess practice",
      ],
    },
    featured: true,
  },
  intro: {
    quickAnswer: "Find out which failure you have before you drill. Four 6-piece rounds show whether pieces vanish, drift a square, or change identity in your head. Then train that failure with a covered board, one move at a time.",
    takeaways: [
      "Four 6-piece, 10-second rounds are a four-minute test of how much picture you hold.",
      "The result board separates a vanished piece from one that landed on the wrong square.",
      "Cover-and-move drills train updating the picture, which a memorize round cannot.",
    ],
    audience: [
      "Players who calculate two moves, then look back at the board and start again.",
      "Anyone who sees the move but not the position it leaves behind.",
    ],
  },
  sections: [
    {
      id: "how-the-picture-fails",
      heading: "Three ways the picture fails",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Visualization is not one skill. When a line goes wrong in your head, one of three things has happened, and each needs a different fix.",
            "A piece vanishes. You calculated a capture, and two moves later you forgot the capturing piece is still standing there. A piece drifts. The knight went to e5, but your picture keeps it on f3. Or a piece changes identity. A bishop turns into a knight, or a white rook into a black one.",
            "Memory Chess scores a placed piece as correct only when its square, its type and its colour all match the original. A knight on the right square in the wrong colour is wrong, not partial credit. That strictness is what makes a round useful as a diagnosis rather than as a score.",
            "After you submit, the result screen shows the position you saw and the one you built. The submitted board marks each piece you placed as Correct or Incorrect. A square you left empty where a piece belonged is marked Missed, with a dotted outline.",
          ],
        },
      ],
    },
    {
      id: "four-minute-check",
      heading: "The four-minute check",
      summary: "Play this before any other drill, then every day, as the six-week plan below sets out.",
      blocks: [
        {
          kind: "drills",
          drills: [
            {
              title: "Six pieces, ten seconds, four rounds",
              description: "Play 4 rounds of 6 pieces with 10 seconds to look. Place the pieces, submit, and write down what each miss was: missed, wrong square, or wrong piece.",
              duration: "About 4 minutes",
              goal: "Learn which of the three failures is yours.",
              play: { label: "Play 6 pieces, 10 seconds", pieceCount: 6, memorizeTime: 10 },
            },
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "Read the result board, not the accuracy number. A dotted outline with nothing near it means the piece vanished. A wrong piece one square away from a dotted outline means it drifted. A wrong piece sitting exactly where a piece belonged means you kept the square and lost the identity.",
            "If you place a seventh piece, accuracy drops ten points for it and it counts as a wrong piece. Treat that as the most serious miss of all. In a game, a phantom piece means you calculate around a defender that does not exist.",
          ],
        },
      ],
    },
    {
      id: "cover-and-move",
      heading: "Cover and move, the drill a round cannot replace",
      summary: "A memorize round tests holding a picture. This drill tests changing it.",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Set up this position on a real board or a diagram. White has king g1, rook e1, knight f3 and pawns on e4, f2, g2 and h2. Black has king g8, rook e8, knight f6 and pawns on e5, f7, g7 and h7.",
            "Cover the board. Now answer without uncovering it. Does 1.Nxe5 win a pawn?",
          ],
        },
        {
          kind: "list",
          ordered: true,
          items: [
            "Say the e-file from top to bottom after the capture: rook e8, then e7 and e6 empty, knight e5, pawn e4, then e3 and e2 empty, rook e1.",
            "Count attackers of e5. The rook on e8 attacks it once.",
            "Count defenders of e5. The rook on e1 would, but your own pawn on e4 stands in the way. Zero.",
            "Conclusion. 1.Nxe5 loses a knight for a pawn after 1...Rxe5. Uncover the board and check every square you named.",
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "Now move the white pawn from e4 to d3 and ask the same question. This time the e-file behind the knight is empty, so the rook on e1 defends e5. After 1.Nxe5 Rxe5 2.Rxe5 White has won a rook and a pawn for a knight, so Black should not recapture, and 1.Nxe5 wins a clean pawn.",
            "One pawn moved one square and the answer flipped. The blocking piece is easy to forget, because it never moves in the line you are calculating. Before you judge a capture, say the whole file or diagonal behind it.",
            "Do this with two positions of your own each day. Take a puzzle you solved yesterday, cover it, say the solution, then name where every piece that moved now stands.",
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
                "A dotted outline on an empty square.",
                "Look in groups. Name the king and everything touching it first, then the outliers.",
              ],
            },
            {
              label: "Drifted piece",
              cells: [
                "A wrong piece one square from a dotted outline.",
                "Say the square name out loud during the look, so you have a name to check the placement against.",
              ],
            },
            {
              label: "Changed piece",
              cells: [
                "A wrong piece exactly where a piece belonged.",
                "Cover-and-move with captures, since a capture changes which pieces are on the board.",
              ],
            },
            {
              label: "Phantom piece",
              cells: [
                "A seventh piece, and ten accuracy points gone.",
                "Count the pieces before you submit. In a line, count captures as you go.",
              ],
            },
          ],
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
              detail: "The four-minute check daily, then one cover-and-move question with a single move. The number to watch is perfect rounds out of four.",
            },
            {
              label: "Weeks 3 and 4",
              duration: "10 minutes a day",
              detail: "Keep the check. Extend cover-and-move to two moves for each side, always ending by saying the file or diagonal behind the last capture.",
            },
            {
              label: "Weeks 5 and 6",
              duration: "12 minutes a day",
              detail: "Three perfect rounds out of four means the picture holds at six pieces. Move the check to 12 pieces with 8 seconds and start cover-and-move again from one move.",
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
          answer: "Because accuracy hides which failure you have. Two players at 67% on six pieces can have different problems, one dropping outliers and the other swapping identities, and they need different drills.",
        },
        {
          question: "Is the 12-piece, 8-second preset a better test?",
          answer: "Not at first. A twelve-piece board covered in dotted outlines is hard to read. At six pieces the misses stay few enough to read one at a time.",
        },
        {
          question: "Does the cover-and-move drill need a real board?",
          answer: "No. A diagram on paper or on a screen works, as long as you can cover it. Setting the pieces up by hand is worth trying, since it makes you place the e4 pawn yourself.",
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
          reason: "A sweep that starts with the pieces on the edges.",
        },
      ],
    },
  ],
};

export default guide;
