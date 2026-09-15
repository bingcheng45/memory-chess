import type { LearnPosition } from "../positions";
import type { LearnGuide } from "../schema";

const guide: LearnGuide = {
  slug: "chess-coordinates-practice",
  goal: "visualization",
  title: "Chess Coordinates Practice for Faster Board Awareness",
  h1: "Chess coordinates practice, from counting squares to reading them",
  description:
    "Stop counting files and ranks. Eight anchor squares, one colour rule, and Memory Chess rounds with the board labels on and then off.",
  primaryKeyword: "chess coordinates practice",
  secondaryKeywords: [
    "chess notation practice",
    "learn chess coordinates",
    "chess square colours",
    "board awareness squares chess",
    "chess square naming drills",
  ],
  ctaLabel: "Play 4 pieces, 12 seconds",
  quickAnswer:
    "Counting to a square is the habit to break. Learn eight anchor squares and the colour rule, then play rounds with the board labels on while naming every square, then with the labels hidden.",
  keyTakeaways: [
    "A square you recognise takes one look. A square you count takes two, and the second one is where you lose the thread.",
    "The board labels in Memory Chess can be hidden from the settings page, and the result screen always shows them.",
    "Square colour follows one rule you can check in your head.",
    "A knight always lands on the other colour, so the colour rule checks every knight path you name.",
  ],
  whoThisIsFor: [
    "Players who still find c3 by running a finger along the bottom edge.",
    "Anyone who loses the thread of a video or a book because the squares come too fast.",
  ],
  timeToRead: "7 min read",
  difficulty: "Beginner",
  publishedAt: "2026-03-24T00:00:00.000Z",
  updatedAt: "2026-09-15T00:00:00.000Z",
  sections: [
    {
      id: "counting-is-the-habit",
      title: "Counting is the habit to break",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "When a commentator says Nd5 and you find d5 by counting four files across and five ranks up, you have done two lookups. The move is gone by the time you finish. Fluent players do one. They see d5 the way you see a word, whole, without spelling it.",
            "That difference is the whole skill. Nothing about coordinates is hard to understand. What takes practice is making the name and the square arrive together, so you stop translating.",
            "The drills below force the translation to happen out loud until it stops being a step.",
          ],
        },
      ],
    },
    {
      id: "eight-anchor-squares",
      title: "Eight anchor squares and one colour rule",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "You do not learn 64 squares. You learn a few anchors and read the rest from them.",
          ],
        },
        {
          kind: "steps",
          ordered: false,
          items: [
            "The four centre squares. d4 and e5 are dark, e4 and d5 are light. Every other square is a short step from one of them.",
            "The four corners. a1 is dark and sits at White's left hand. h1 is light, a8 is light, h8 is dark.",
            "The colour rule. Count the file as a number, a is 1 and h is 8, and add the rank. Even is dark, odd is light. c3 is 3 plus 3, even, dark. g2 is 7 plus 2, odd, light.",
            "The two long diagonals. a1 to h8 runs on dark squares, h1 to a8 on light. A bishop on the a1 diagonal can never reach the h1 diagonal.",
          ],
        },
        {
          kind: "paragraphs",
          paragraphs: [
            "Test the anchors away from the board. Someone names a square, you say its colour before they finish the word. Ten in a row without a miss and the anchors are in.",
          ],
        },
      ],
    },
    {
      id: "labels-on-then-off",
      title: "Labels on, then labels off",
      summary:
        "Memory Chess shows the file letters and rank numbers on every board by default. A switch on the settings page hides them, and that switch is the drill.",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "The setting is called Show board coordinates, on the settings page, and it is on for everyone until you turn it off. It hides the labels on the memorize board and on the board where you place pieces. The result screen ignores it and always shows both boards labelled, so you can check your placements by name.",
            "The browser remembers the setting, and a round link cannot change it. Both drill links below open the same round, and only the setting decides whether its labels show.",
            "If you use a screen reader, every square announces its name, and a square with a piece on it announces the piece as well. The labels setting does not change that.",
          ],
          link: { phrase: "the settings page", href: "/settings" },
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Labels on, say every square",
              description:
                "Play 5 rounds of 4 pieces with 12 seconds to look. During the look, say each piece with its square aloud, such as white rook a1. Place them, then check the result board by name.",
              duration: "About 4 minutes",
              goal: "Tie every piece you remember to a square name, not to a spot on the board.",
              ctaLabel: "Play 4 pieces, 12 seconds",
              setup: {
                pieceCount: 4,
                memorizeTime: 12,
              },
            },
            {
              title: "Labels off, place by name",
              description:
                "Turn off Show board coordinates on the settings page, then play 5 rounds of 4 pieces with 12 seconds to look. Say the squares aloud as before and place each piece by finding its square from the nearest anchor, not from the edge.",
              duration: "About 4 minutes",
              goal: "Find a named square on a blank board without running a finger along the edge.",
              ctaLabel: "Play 4 pieces, 12 seconds",
              link: { phrase: "the settings page", href: "/settings" },
              setup: {
                pieceCount: 4,
                memorizeTime: 12,
              },
            },
          ],
        },
        {
          kind: "paragraphs",
          paragraphs: [
            "Four pieces is deliberate. The point is the naming, not the memory load. The round should feel easy to hold, so the only thing under pressure is the square name. When five rounds with the labels off come back all correct, move to 6 pieces with the same 12 seconds.",
          ],
        },
      ],
    },
    {
      id: "knight-paths-and-diagonals",
      title: "Knight paths and diagonals without a board",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Once squares have names, the next thing is naming what a piece can reach, because that is what you do when you read a game. Do these anywhere, with no board.",
          ],
        },
        {
          kind: "steps",
          ordered: false,
          items: [
            "Knight from e4. Say all eight squares. c3, c5, d2, d6, f2, f6, g3, g5. Then check with the colour rule. e4 is light, so every one of them must be dark.",
            "Knight from b1. Only three squares, a3, c3 and d2. Corners and edges cut a knight's reach, which is why a knight on the rim is a poor piece.",
            "Bishop from c1 along both its diagonals. d2, e3, f4, g5, h6 on one, b2 and a3 on the other.",
            "Rook from a1 along the rank to h1 and up the file to a8. Then a rook on d4. On an empty board both see fourteen squares, seven along the rank and seven along the file, from any square.",
            "A square and its colour, then its knight squares, then its diagonals. When you can do that for any square in under ten seconds, the coordinates are no longer a step.",
          ],
        },
      ],
    },
    {
      id: "where-counting-costs-you",
      title: "Where counting costs you",
      blocks: [
        {
          kind: "comparison",
          columns: ["Situation", "With counting", "With recognition"],
          rows: [
            {
              label: "A video or a stream",
              struggling: "The commentator is two moves ahead by the time you find the square.",
              stronger: "You follow the line as it is said.",
            },
            {
              label: "A puzzle solution in text",
              struggling: "You set the pieces up wrong and the solution makes no sense.",
              stronger: "You read Rxd7 and see the capture before you touch a piece.",
            },
            {
              label: "Reviewing your own game",
              struggling: "Your notes say the knight, the other knight, that pawn.",
              stronger: "Your notes say Nd5, Nb3 and the e5 pawn, and you can still find them a month later.",
            },
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: "Why turn the labels off if the game shows them anyway?",
      answer:
        "Because a label lets you read the square instead of knowing it. With the labels hidden, the only way to put a rook on c3 is to know where c3 is. The result screen brings the labels back, so you still get the check.",
    },
    {
      question: "Do I need to learn the board from Black's side?",
      answer:
        "Not for reading notation, since the names do not change. For playing Black over the board, do the same anchor drill with the board turned round, so a1 sits at your top right.",
    },
  ],
  relatedArticles: [
    {
      slug: "chess-visualization-exercises",
      reason: "Once squares have names, the picture you hold in a line stops drifting.",
    },
    {
      slug: "blindfold-chess-training-for-beginners",
      reason: "Blindfold play assumes you can name a square's colour without thinking.",
    },
    {
      slug: "how-to-see-the-whole-board-in-chess",
      reason: "A scan of the whole board is faster when every square has a name.",
    },
  ],
  sources: [],
};

export const positions: LearnPosition[] = [
  {
    id: "anchor-colours",
    sectionId: "eight-anchor-squares",
    white: [],
    black: [],
    claims: [
      { kind: "squareColour", squares: ["d4", "e5", "a1", "h8", "c3"], colour: "dark" },
      { kind: "squareColour", squares: ["e4", "d5", "h1", "a8", "g2"], colour: "light" },
    ],
  },
  {
    id: "knight-e4",
    sectionId: "knight-paths-and-diagonals",
    white: ["Ne4"],
    black: [],
    claims: [
      { kind: "reach", square: "e4", squares: ["c3", "c5", "d2", "d6", "f2", "f6", "g3", "g5"] },
      { kind: "squareColour", squares: ["e4"], colour: "light" },
      { kind: "squareColour", squares: ["c3", "c5", "d2", "d6", "f2", "f6", "g3", "g5"], colour: "dark" },
    ],
  },
  {
    id: "knight-b1",
    sectionId: "knight-paths-and-diagonals",
    white: ["Nb1"],
    black: [],
    claims: [{ kind: "reach", square: "b1", squares: ["a3", "c3", "d2"] }],
  },
  {
    id: "bishop-c1",
    sectionId: "knight-paths-and-diagonals",
    white: ["Bc1"],
    black: [],
    claims: [{ kind: "reach", square: "c1", squares: ["d2", "e3", "f4", "g5", "h6", "b2", "a3"] }],
  },
];

export default guide;
