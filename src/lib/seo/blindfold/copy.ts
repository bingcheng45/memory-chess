export const BLINDFOLD_PATH = "/blindfold";
export const BLINDFOLD_GUIDE_PATH = "/learn/blindfold-chess-training-for-beginners";
export const BOARD_GAME_RULES_PATH = "/learn/how-to-play-memory-chess-board-game";

/** Page copy for /blindfold, which is English-only like the guides it links to. */
export const BLINDFOLD_PAGE_COPY = {
  meta: {
    title: "Blindfold Chess Trainer: Free Online Practice | Memory Chess",
    description:
      "Train blindfold chess in your browser. Study a position as notation, then rebuild it square by square. Free, no sign-up, with its own leaderboard.",
    socialTitle: "Blindfold Chess Trainer",
    socialDescription: "Study a chess position as notation, then rebuild it square by square. Free, with its own leaderboard.",
  },
  kicker: "Blindfold mode",
  title: "Blindfold chess trainer",
  lede: "Train blindfold chess in your browser. You get a position as written notation, with no pieces on the board, and rebuild it square by square from memory.",
  start: { primary: "Start a blindfold round", secondary: "Choose pieces and time" },
  sections: [
    {
      id: "what-it-does",
      title: "What the trainer does",
      paragraphs: [
        "The blindfold chess trainer tests one skill: reading a position you cannot see and holding it well enough to set it up again. It writes the position out in two lines, White first and then Black. Each side starts with its king, then the queen, rooks, bishops and knights, and a pawn is given by its square alone, so a line reads like Ke1, Qd1, Nf3, e4. A legend under the list spells out the letters.",
        "After you place the pieces, the result shows your accuracy, the pieces you placed right and wrong, and how long you took, so you can see which part of the list slipped.",
      ],
    },
    {
      id: "how-it-works",
      title: "How a blindfold round works",
      paragraphs: [
        "The position appears as a list of pieces and squares, such as Ke1 or Nf3. You read it, build the board in your head, and when the time runs out the list disappears.",
        "Then you place every piece on an empty board. The score is how many pieces you put on the right square, the same as in a normal Memory Chess round.",
      ],
    },
    {
      id: "why-notation",
      title: "Why study the position as notation",
      paragraphs: [
        "In a blindfold game nobody shows you the pieces. You hear or read moves and keep the position in your head. Reading a position as notation and rebuilding it is the same skill with the board taken away, and you can repeat it in under a minute.",
        "Start with a few pieces and a long study time, then add pieces or cut the time as your rebuilds come out clean.",
      ],
    },
    {
      id: "first-week",
      title: "A first week of blindfold rounds",
      paragraphs: [
        "The start button above opens a round of 6 pieces with 10 seconds to read them. If that rebuild comes out messy, use Choose pieces and time to drop to fewer pieces and a longer study time, and say each square under your breath as you read it.",
        "Add one piece once two rebuilds in a row are perfect. Cut the time only after the piece count feels easy, because reading a list of squares takes longer than glancing at a board.",
        "A blindfold round never changes your skill rating. The rating measures rounds studied on a board, so a hard blindfold session cannot pull it down.",
      ],
    },
    {
      id: "session",
      title: "How a ten-minute session runs",
      paragraphs: [
        "Open with two or three rounds at a size you rebuild cleanly, so reading notation feels routine again. Then play five or six rounds at the edge of what you can hold, where about one rebuild in two has a mistake. Close with one easy round, so the session ends on a clean board.",
        "Read the result after every miss before you start the next round. If the missed pieces all come from the Black line, slow down on the second line. If they are pawns, say each pawn square aloud as you read it. Then play the next round at the same size to test the fix.",
      ],
    },
    {
      id: "who",
      title: "Who the trainer is for",
      paragraphs: [
        "It is for players who want to start blindfold chess, and for players whose calculation falls apart three moves deep because the picture in their head drifts. You need to read algebraic notation, but you do not need to have played a blindfold game.",
        "It also suits players who follow games from a move list, in a book, a broadcast or a commentary, and want to keep the board in their head without setting up pieces. Coaches can use a few rounds as a warm-up before a lesson.",
      ],
    },
    {
      id: "leaderboard",
      title: "Free, with its own leaderboard",
      paragraphs: [
        "There is no sign-up. Blindfold rounds are ranked on their own boards, apart from the rounds studied on a board, so a blindfold score is only compared with other blindfold scores.",
      ],
    },
  ],
  guide: { before: "Want a plan? Follow the ", anchor: "four-stage blindfold chess training plan", after: "." },
  rules: { before: "Looking for the wooden board game? ", anchor: "Read its rules", after: "." },
} as const;
