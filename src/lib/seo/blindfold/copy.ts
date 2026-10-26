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
