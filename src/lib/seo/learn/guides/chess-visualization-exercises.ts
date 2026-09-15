import type { LearnPosition, PieceToken } from "../positions";
import type { LearnGuide } from "../schema";

const guide: LearnGuide = {
  slug: "chess-visualization-exercises",
  goal: "visualization",
  title: "Chess Visualization Exercises for Beginners",
  h1: "Chess visualization exercises for when the picture fades two moves in",
  description:
    "Visualization drills for players who lose the position two moves into a line, with a four-minute check that shows whether pieces vanish, drift or change identity.",
  primaryKeyword: "chess visualization exercises",
  secondaryKeywords: [
    "chess visualization training",
    "calculate moves ahead",
    "board visualization chess",
    "cover and move drill",
    "mental chess practice",
  ],
  ctaLabel: "Play 6 pieces, 10 seconds",
  quickAnswer:
    "Find out which failure you have before you drill. Four 6-piece rounds show whether pieces vanish, drift a square, or change identity in your head. Then train that failure with a covered board, one move at a time.",
  keyTakeaways: [
    "Four 6-piece, 10-second rounds are a four-minute test of how much picture you hold.",
    "The result board separates a vanished piece from one that landed on the wrong square.",
    "Cover-and-move drills train updating the picture, which a memorize round cannot.",
  ],
  whoThisIsFor: [
    "Players who calculate two moves, then look back at the board and start again.",
    "Anyone who sees the move but not the position it leaves behind.",
  ],
  timeToRead: "7 min read",
  difficulty: "Beginner",
  featured: true,
  publishedAt: "2026-03-06T00:00:00.000Z",
  updatedAt: "2026-09-15T00:00:00.000Z",
  sections: [
    {
      id: "how-the-picture-fails",
      title: "Three ways the picture fails",
      blocks: [
        {
          kind: "paragraphs",
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
      title: "The four-minute check",
      summary: "Play this before any other drill, and again at the end of each week.",
      blocks: [
        {
          kind: "drills",
          drills: [
            {
              title: "Six pieces, ten seconds, four rounds",
              description:
                "Play 4 rounds of 6 pieces with 10 seconds to look. Place the pieces, submit, and write down what each miss was: missed, wrong square, or wrong piece.",
              duration: "About 4 minutes",
              goal: "Learn which of the three failures is yours.",
              ctaLabel: "Play 6 pieces, 10 seconds",
              setup: {
                pieceCount: 6,
                memorizeTime: 10,
              },
            },
          ],
        },
        {
          kind: "paragraphs",
          paragraphs: [
            "Read the result board, not the accuracy number. A dotted outline with nothing near it means the piece vanished. A wrong piece one square away from a dotted outline means it drifted. A wrong piece sitting exactly where a piece belonged means you kept the square and lost the identity.",
            "If you place a seventh piece, accuracy drops ten points for it and it counts as a wrong piece. Treat that as the most serious miss of all. In a game, a phantom piece means you calculate around a defender that does not exist.",
          ],
        },
      ],
    },
    {
      id: "cover-and-move",
      title: "Cover and move, the drill a round cannot replace",
      summary: "A memorize round tests holding a picture. This drill tests changing it.",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Set up this position on a real board or a diagram. White has king g1, rook e1, knight f3 and pawns on e4, f2, g2 and h2. Black has king g8, rook e8, knight f6 and pawns on e5, f7, g7 and h7.",
            "Cover the board. Now answer without uncovering it. Does 1.Nxe5 win a pawn?",
          ],
        },
        {
          kind: "steps",
          ordered: true,
          items: [
            "Say the e-file from top to bottom after the capture: rook e8, then e7 and e6 empty, knight e5, pawn e4, then e3 and e2 empty, rook e1.",
            "Count attackers of e5. The rook on e8 attacks it once.",
            "Count defenders of e5. The rook on e1 would, but your own pawn on e4 stands in the way. Zero.",
            "Conclusion. 1.Nxe5 loses a knight for a pawn after 1...Rxe5. Uncover the board and check every square you named.",
          ],
        },
        {
          kind: "paragraphs",
          paragraphs: [
            "Now move the white pawn from e4 to d3 and ask the same question. This time the e-file behind the knight is empty, so the rook on e1 defends e5. After 1.Nxe5 Rxe5 2.Rxe5 White has won a rook and a pawn for a knight, so Black should not recapture, and 1.Nxe5 wins a clean pawn.",
            "One pawn moved one square and the answer flipped. The blocking piece is easy to forget, because it never moves in the line you are calculating. Before you judge a capture, say the whole file or diagonal behind it.",
            "Do this with two positions of your own each day. Take a puzzle you solved yesterday, cover it, say the solution, then name where every piece that moved now stands.",
          ],
        },
      ],
    },
    {
      id: "which-drill-for-which-failure",
      title: "Which drill fixes which failure",
      blocks: [
        {
          kind: "comparison",
          columns: ["Failure", "What the result board shows", "What to train"],
          rows: [
            {
              label: "Vanished piece",
              struggling: "A dotted outline on an empty square.",
              stronger: "Look in groups. Name the king and everything touching it first, then the outliers.",
            },
            {
              label: "Drifted piece",
              struggling: "A wrong piece one square from a dotted outline.",
              stronger: "Say the square name out loud during the look, so you have a name to check the placement against.",
            },
            {
              label: "Changed piece",
              struggling: "A wrong piece exactly where a piece belonged.",
              stronger: "Cover-and-move with captures, since a capture changes which pieces are on the board.",
            },
            {
              label: "Phantom piece",
              struggling: "A seventh piece, and ten accuracy points gone.",
              stronger: "Count the pieces before you submit. In a line, count captures as you go.",
            },
          ],
        },
      ],
    },
    {
      id: "six-week-progression",
      title: "Six weeks with one number to watch",
      blocks: [
        {
          kind: "plan",
          steps: [
            {
              label: "Weeks 1 and 2",
              duration: "8 minutes a day",
              detail:
                "The four-minute check daily, then one cover-and-move question with a single move. The number to watch is perfect rounds out of four.",
            },
            {
              label: "Weeks 3 and 4",
              duration: "10 minutes a day",
              detail:
                "Keep the check. Extend cover-and-move to two moves for each side, always ending by saying the file or diagonal behind the last capture.",
            },
            {
              label: "Weeks 5 and 6",
              duration: "12 minutes a day",
              detail:
                "Three perfect rounds out of four means the picture holds at six pieces. Move the check to 12 pieces with 8 seconds and start cover-and-move again from one move.",
            },
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: "Why not just play more rounds until accuracy goes up?",
      answer:
        "Because accuracy hides which failure you have. Two players at 67% on six pieces can have different problems, one dropping outliers and the other swapping identities, and they need different drills.",
    },
    {
      question: "Is the 12-piece, 8-second preset a better test?",
      answer:
        "Not at first. A twelve-piece board covered in dotted outlines is hard to read. At six pieces the misses stay few enough to read one at a time.",
    },
    {
      question: "Does the cover-and-move drill need a real board?",
      answer:
        "No. A diagram on paper or on a screen works, as long as you can cover it. Setting the pieces up by hand is worth trying, since it makes you place the e4 pawn yourself.",
    },
  ],
  relatedArticles: [
    {
      slug: "blindfold-chess-training-for-beginners",
      reason: "When a covered board feels easy, the next step is a whole game without one.",
    },
    {
      slug: "chess-calculation-exercises-for-beginners",
      reason: "Uses the cover-and-move habit on longer lines.",
    },
    {
      slug: "how-to-see-the-whole-board-in-chess",
      reason: "A sweep that starts with the pieces on the edges.",
    },
  ],
  sources: [],
};

const COVER_BLACK: PieceToken[] = ["Kg8", "Re8", "Nf6", "e5", "f7", "g7", "h7"];

export const positions: LearnPosition[] = [
  {
    id: "cover-and-move",
    sectionId: "cover-and-move",
    white: ["Kg1", "Re1", "Nf3", "e4", "f2", "g2", "h2"],
    black: COVER_BLACK,
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
    sectionId: "cover-and-move",
    white: ["Kg1", "Re1", "Nf3", "d3", "f2", "g2", "h2"],
    black: COVER_BLACK,
    line: ["Nxe5"],
    claims: [{ kind: "attackers", square: "e5", side: "w", from: ["e1"] }],
  },
  {
    id: "cover-and-move-pawn-on-d3-recaptured",
    sectionId: "cover-and-move",
    white: ["Kg1", "Re1", "Nf3", "d3", "f2", "g2", "h2"],
    black: COVER_BLACK,
    line: ["Nxe5", "Rxe5", "Rxe5"],
    claims: [{ kind: "material", white: "kppppr", black: "knppp" }],
  },
];

export default guide;
