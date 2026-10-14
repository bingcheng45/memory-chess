import type { LearnDocument } from "../schema";

const guide: LearnDocument = {
  meta: {
    slug: "chess-coordinates-practice",
    title: "Chess Coordinates Practice for Faster Board Awareness",
    h1: "Chess coordinates practice, from counting squares to reading them",
    description: "Chess coordinates practice in three steps. Learn eight anchor squares and a colour rule, then name every square in Memory Chess rounds with labels on and off.",
    group: "board-vision",
    level: "beginner",
    publishedAt: "2026-03-24T00:00:00.000Z",
    updatedAt: "2026-10-13T00:00:00.000Z",
    questions: [
      "How do I learn chess coordinates fast?",
      "How do I know a square's colour without looking?",
      "How do I read squares without counting?",
    ],
    keywords: {
      primary: "chess coordinates practice",
      secondary: [
        "chess notation practice",
        "learn chess coordinates",
        "chess square colours",
        "board awareness squares chess",
        "chess square naming drills",
      ],
    },
  },
  intro: {
    quickAnswer: "Chess coordinates practice should make a square's name and its place arrive in one look, without counting files and ranks. Learn eight anchor squares and the colour rule first. Then play short Memory Chess rounds naming every square aloud, first reading the board labels and then naming each square before you look at them.",
    takeaways: [
      "A square you count takes two lookups, the file and then the rank. A square you recognise takes one.",
      "Add the file number to the rank number. An even total is a dark square, an odd total is light.",
      "A knight always lands on the other colour, so the colour rule checks every knight move you name.",
      "Memory Chess shows the file letters and rank numbers on every board. Say each square's name before your eyes reach the edge, and the labels only check what you already know.",
    ],
    audience: [
      "Players who still find c3 by running a finger along the bottom edge.",
      "Anyone who loses the thread of a video or a book because the squares come too fast.",
    ],
  },
  sections: [
    {
      id: "why-counting-is-slow",
      heading: "Why counting files and ranks slows you down",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "To find d5 by counting, you go four files across and then five ranks up. That is two lookups. Seeing d5 the way you see a familiar word takes one.",
            "Nothing about coordinates is hard to understand. The practice is making the name and the square arrive together, so you stop translating one into the other. The table shows where the second lookup costs you.",
          ],
        },
        {
          kind: "table",
          columns: ["Situation", "When you count", "When you recognise"],
          rows: [
            {
              label: "A video or a stream",
              cells: [
                "The commentator is two moves ahead by the time you find the square.",
                "You follow the line as it is said.",
              ],
            },
            {
              label: "A puzzle solution in text",
              cells: [
                "You set the pieces up wrong and the solution makes no sense.",
                "You read Rxd7 and see the capture before you touch a piece.",
              ],
            },
            {
              label: "Reviewing your own game",
              cells: [
                "Your notes say the knight, the other knight, that pawn.",
                "Your notes say Nd5, Nb3 and the e5 pawn, and you can still find them a month later.",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "eight-anchor-squares",
      heading: "Eight anchor squares and one colour rule",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Eight squares hold the board together. No other square is more than three steps from one of them, so you read every square from its nearest anchor.",
          ],
        },
        {
          kind: "list",
          ordered: false,
          items: [
            "The four centre squares. d4 and e5 are dark, e4 and d5 are light.",
            "The four corners. a1 is dark and sits at White's left hand. h1 is light, a8 is light, h8 is dark. That is why each player has a light square in the right-hand corner.",
            "The colour rule. Count the file as a number, a is 1 and h is 8, and add the rank. Even is dark, odd is light. c3 is 3 plus 3, even, dark. g2 is 7 plus 2, odd, light.",
            "The two long diagonals. a1 to h8 runs on dark squares, h1 to a8 on light. A bishop on one of them can never reach the other.",
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "Test the anchors away from the board. Have someone call out squares at random. Say each square's colour before they finish saying its name. Ten in a row without a miss and the anchors are in.",
          ],
        },
      ],
      facts: [
        {
          id: "anchor-colours",
          white: [],
          black: [],
          claims: [
            { kind: "squareColour", squares: ["d4", "e5", "a1", "h8", "c3"], colour: "dark" },
            { kind: "squareColour", squares: ["e4", "d5", "h1", "a8", "g2"], colour: "light" },
          ],
        },
      ],
    },
    {
      id: "name-it-before-you-read-it",
      heading: "Read the labels, then beat them",
      summary: "Memory Chess shows the file letters and rank numbers on every board. Use them first to learn the squares, then only to check a name you have already said.",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "The labels run along the left and bottom edges of the board you study, the board you rebuild on and the result board. They are always shown, so the drill is where you let your eyes go.",
            "The result board marks each piece you placed right or wrong and rings each square you missed, so you can see whether you found the square. Both drills below open the same round, and only your habit changes between them.",
            "If you use a screen reader, every square announces its name, and a square with a piece on it announces the piece too.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Labels on, say every square",
              description: "Play 5 rounds of 4 pieces with 12 seconds to look. During the look, say each piece with its square aloud, such as white rook a1. Place them, then read the result board and name each square it marks.",
              duration: "About 4 minutes",
              goal: "Remember every piece as a piece and a square name, such as rook a1.",
              play: { label: "Play 4 pieces, 12 seconds", pieceCount: 4, memorizeTime: 12 },
            },
            {
              title: "Name it before you read it",
              description: "Play 5 rounds of 4 pieces with 12 seconds to look. Keep your eyes on the pieces, not the edges. Say each square aloud before you glance at its label, finding it from its nearest anchor, so c3 is one step down and left of d4. A square you had to read first counts as missed.",
              duration: "About 4 minutes",
              goal: "Name a square from its place on the board, with the label only confirming it.",
              play: { label: "Play 4 pieces, 12 seconds", pieceCount: 4, memorizeTime: 12 },
            },
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "Four pieces keeps the memory load light, so the only thing under pressure is the square name. When five rounds in a row come back all correct with every square named before you read its label, move to 6 pieces with the same 12 seconds.",
          ],
        },
      ],
    },
    {
      id: "knight-paths-and-diagonals",
      heading: "Knight paths and diagonals without a board",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Once squares have names, name what a piece can reach. That is what you do when you read a game. Work through these in order, anywhere, with no board.",
          ],
        },
        {
          kind: "board",
          position: {
            id: "knight-e4",
            white: ["Ne4"],
            black: [],
            claims: [
              {
                kind: "reach",
                square: "e4",
                squares: ["c3", "c5", "d2", "d6", "f2", "f6", "g3", "g5"],
              },
              { kind: "squareColour", squares: ["e4"], colour: "light" },
              {
                kind: "squareColour",
                squares: ["c3", "c5", "d2", "d6", "f2", "f6", "g3", "g5"],
                colour: "dark",
              },
            ],
          },
          marks: [
            { square: "c3", kind: "ring" },
            { square: "c5", kind: "ring" },
            { square: "d2", kind: "ring" },
            { square: "d6", kind: "ring" },
            { square: "f2", kind: "ring" },
            { square: "f6", kind: "ring" },
            { square: "g3", kind: "ring" },
            { square: "g5", kind: "ring" },
          ],
          caption: "The knight stands on light e4, and all eight squares it reaches are dark.",
        },
        {
          kind: "list",
          ordered: true,
          items: [
            "Knight from e4. Say all eight squares. c3, c5, d2, d6, f2, f6, g3, g5. Then check with the colour rule. e4 is light, so every one of them must be dark.",
            "Knight from b1. Only three squares, a3, c3 and d2. The edge of the board cuts a knight's reach, which is why a knight on the rim is a poor piece.",
            "Bishop from c1 along both its diagonals. d2, e3, f4, g5, h6 on one, b2 and a3 on the other.",
            "Rook from a1 along the rank to h1 and up the file to a8. Then a rook on d4. On an empty board both see fourteen squares, seven along the rank and seven along the file.",
            "Any square you pick. Say its colour, then its knight squares, then its diagonals. When that takes under ten seconds for any square, the coordinates are no longer a step.",
          ],
        },
      ],
      facts: [
        {
          id: "knight-b1",
          white: ["Nb1"],
          black: [],
          claims: [{ kind: "reach", square: "b1", squares: ["a3", "c3", "d2"] }],
        },
        {
          id: "bishop-c1",
          white: ["Bc1"],
          black: [],
          claims: [{ kind: "reach", square: "c1", squares: ["d2", "e3", "f4", "g5", "h6", "b2", "a3"] }],
        },
      ],
    },
  ],
  end: [
    {
      kind: "cta",
      target: { kind: "game", label: "Play 4 pieces, 12 seconds", pieceCount: 4, memorizeTime: 12 },
      why: "Four pieces with twelve seconds leaves time to say each square's name aloud before the board clears.",
    },
    {
      kind: "faq",
      items: [
        {
          question: "Why name a square before reading its label?",
          answer: "A label lets you read the square instead of knowing it. Saying the name first is how you find out whether you know where c3 is. The label then checks you at once, and the result board marks each piece you placed right or wrong and rings each square you missed.",
        },
        {
          question: "Do I need to learn the board from Black's side?",
          answer: "Not for reading notation, since the square names never change. For playing Black over the board, do the same anchor drill with the board turned round. Then a1 sits at your top right and h8 at your bottom left.",
        },
      ],
    },
    {
      kind: "furtherReading",
      items: [
        {
          kind: "guide",
          slug: "chess-visualization-exercises",
          reason: "Uses square names to check the picture you hold in a line.",
        },
        {
          kind: "guide",
          slug: "blindfold-chess-training-for-beginners",
          reason: "Blindfold play assumes you can name a square's colour without thinking.",
        },
        {
          kind: "guide",
          slug: "how-to-see-the-whole-board-in-chess",
          reason: "A scan of the whole board is faster when every square has a name.",
        },
      ],
    },
  ],
};

export default guide;
