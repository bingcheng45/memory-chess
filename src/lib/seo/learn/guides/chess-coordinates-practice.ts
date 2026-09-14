import type { LearnGuide } from "../schema";

const guide: LearnGuide = {
  slug: "chess-coordinates-practice",
  goal: "visualization",
  title: "Chess Coordinates Practice for Faster Board Awareness",
  h1: "Chess coordinates practice for beginners",
  description: "Learn chess square names faster and make board scanning, notation, and visualization easier.",
  primaryKeyword: "chess coordinates practice",
  secondaryKeywords: [
    "chess notation practice",
    "learn chess coordinates",
    "faster square recognition chess",
    "board awareness squares chess",
    "chess square naming drills",
  ],
  ctaLabel: "Practise Square Names",
  quickAnswer: "Chess coordinates are the names of the 64 squares. Learning them helps you scan the board, picture moves, and review games more easily.",
  keyTakeaways: [
    "Fast square recognition makes board scans easier.",
    "Practise coordinates with real positions.",
    "You only need the basic square names to begin.",
  ],
  whoThisIsFor: [
    "Beginners who still count files and ranks slowly.",
    "Players who want board scans and visualization to feel faster.",
    "Anyone who finds chess notation confusing.",
  ],
  timeToRead: "7 min read",
  difficulty: "Beginner",
  publishedAt: "2026-03-06T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
  sections: [
    {
      id: "what-changes",
      title: "What improves first",
      eyebrow: "Mental board control",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Coordinates are useful for more than books and move lists. Fast square recognition helps with board vision, memory, and game review.",
            "When you know the square names, the board feels like a clear map instead of a group of vague areas.",
          ],
        },
      ],
    },
    {
      id: "start-here",
      title: "Start with square names on a real board",
      summary: "You can try these steps today.",
      blocks: [
        {
          kind: "steps",
          ordered: true,
          items: [
            "Pick one file or rank pattern and name the squares out loud.",
            "Call out the square of every piece while rebuilding a Memory Chess position.",
            "Use one recent game position and name key attackers and defenders by square.",
            "Practice bishops, rooks, and knight jumps by coordinates, not only by sight.",
            "Finish with one rapid board scan where every loose piece is named by square.",
          ],
        },
      ],
    },
    {
      id: "drills",
      title: "Coordinate drills that help real play",
      summary: "A drill with a play link opens that exact round in Memory Chess. The rest you do away from the game.",
      blocks: [
        {
          kind: "drills",
          drills: [
            {
              title: "Piece-to-square naming",
              description: "Play 6 pieces with 12 seconds to look. Say each piece and its square out loud while you look, then place them back.",
              duration: "4 minutes",
              goal: "Connect square names to pieces you need to remember.",
              ctaLabel: "Play 6 pieces, 12 seconds",
              setup: {
                pieceCount: 6,
                memorizeTime: 12,
              },
            },
            {
              title: "Long-range line naming",
              description: "Trace bishop and rook lines and say the squares they influence.",
              duration: "4 minutes",
              goal: "Make coordinates useful during full-board scans.",
              ctaLabel: "Trace lines by square",
            },
            {
              title: "Knight jump mapping",
              description: "Choose one knight square and name all legal destinations quickly.",
              duration: "3 minutes",
              goal: "Recognise knight moves and target squares faster.",
              ctaLabel: "Map knight jumps",
            },
          ],
        },
      ],
    },
    {
      id: "comparison",
      title: "Slow square recognition vs faster square recognition",
      summary: "Coordinates will not improve every part of your chess, but they make several skills easier.",
      blocks: [
        {
          kind: "comparison",
          columns: [
            "Situation",
            "Before practice",
            "After practice",
          ],
          rows: [
            {
              label: "Board scan",
              struggling: "You know the shape but not the square names.",
              stronger: "You identify threats and defenders more precisely and faster.",
            },
            {
              label: "Visualization",
              struggling: "Imagined moves feel vague.",
              stronger: "The resulting board becomes easier to describe and hold.",
            },
            {
              label: "Review",
              struggling: "Post-game notes stay fuzzy.",
              stronger: "You can describe the key moment clearly enough to study it later.",
            },
          ],
        },
      ],
    },
    {
      id: "mistakes",
      title: "Common mistakes to avoid",
      blocks: [
        {
          kind: "steps",
          ordered: false,
          items: [
            "Practising square names without using real positions.",
            "Trying to memorize notation rules without using live board examples.",
            "Ignoring long-range piece lines while practicing square names.",
            "Dropping the habit once basic notation becomes familiar.",
          ],
        },
        {
          kind: "callout",
          title: "What to do instead",
          body: "Do not only repeat square names. Use them with real pieces and positions.",
        },
      ],
    },
    {
      id: "plan",
      title: "7-day coordinate warm-up plan",
      summary: "Follow these steps before making the practice harder or longer.",
      blocks: [
        {
          kind: "plan",
          steps: [
            {
              label: "Day 1 to 2",
              duration: "8 minutes",
              detail: "Name each piece and square while rebuilding a Memory Chess position.",
            },
            {
              label: "Day 3 to 4",
              duration: "10 minutes",
              detail: "Add long-range line naming for bishops and rooks.",
            },
            {
              label: "Day 5",
              duration: "10 minutes",
              detail: "Practice knight jump mapping and central-square fluency.",
            },
            {
              label: "Day 6 to 7",
              duration: "12 minutes",
              detail: "Use square names during a full board scan, then review one important position using only square names.",
            },
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: "Do chess coordinates really matter for beginners?",
      answer: "Yes, when they speed up board awareness, visualization, and review. You do not need perfect notation, but faster square recognition helps.",
    },
    {
      question: "What is the best way to learn coordinates?",
      answer: "Learn square names with real positions and pieces instead of repeating notation alone.",
    },
    {
      question: "Will this help me stop blundering?",
      answer: "Indirectly, yes. Faster square recognition makes board scans and threat checks more precise.",
    },
    {
      question: "How long should I practice coordinates?",
      answer: "Five to ten focused minutes is enough when the drill is tied to real board work.",
    },
  ],
  relatedArticles: [
    {
      slug: "how-to-see-the-whole-board-in-chess",
      reason: "Use coordinates to support a wider scan of the whole board.",
    },
    {
      slug: "chess-visualization-exercises",
      reason: "Make mental board updates more precise by square.",
    },
    {
      slug: "how-to-think-in-chess-for-beginners",
      reason: "Use square naming to simplify your thought process under pressure.",
    },
  ],
  sources: [
    {
      title: "Templates in Chess Memory: A Mechanism for Recalling Several Boards",
      url: "https://doi.org/10.1006/cogp.1996.0011",
    },
    {
      title: "Recognition and Look-Ahead Search in Time-Constrained Expert Chess",
      url: "https://doi.org/10.1111/j.1467-9280.1996.tb00666.x",
    },
    {
      title: "How important is chess notation? (r/chessbeginners)",
      url: "https://www.reddit.com/r/chessbeginners/comments/1egpjmy/how_important_is_chess_notation/",
      note: "Useful for understanding how beginners often underrate coordinates until they affect board clarity.",
    },
  ],
};

export default guide;
