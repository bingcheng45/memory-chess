import type { LearnGuide } from "../schema";

const guide: LearnGuide = {
  slug: "chess-calculation-exercises-for-beginners",
  goal: "visualization",
  title: "Chess Calculation Exercises for Beginners Who Lose the Board After Two Moves",
  h1: "Calculation exercises for beginners who lose the board after two moves",
  description:
    "Why short lines collapse, one position with two knight checks to practise on, and exercises for holding a position while the pieces in your head move.",
  primaryKeyword: "chess calculation exercises",
  secondaryKeywords: [
    "beginner chess calculation",
    "calculate moves ahead chess",
    "working memory for chess",
    "candidate move practice",
    "hold a position in your head",
  ],
  ctaLabel: "Open the 8-piece, 10-second round",
  quickAnswer:
    "Compare two moves, two plies deep, and say each line out loud before you check it. When a line collapses, check the starting position before you blame the moves.",
  keyTakeaways: [
    "A line fails at the piece you stopped seeing, and a piece that never moved is the easiest to stop seeing.",
    "Two candidate moves at two plies is enough work for one decision.",
    "Rebuilding a position from an empty board is the same act as holding one while you calculate.",
  ],
  whoThisIsFor: [
    "Players who imagine a move and then cannot say where the defenders are.",
    "Beginners who play the first move they see in sharp positions.",
    "Anyone who has been told to calculate and never told what to hold in mind.",
  ],
  timeToRead: "8 min read",
  difficulty: "Beginner to Intermediate",
  publishedAt: "2026-03-24T00:00:00.000Z",
  updatedAt: "2026-09-15T00:00:00.000Z",
  sections: [
    {
      id: "where-a-line-breaks",
      title: "Where a two-move line breaks",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Calculation is holding a position that is not on the board. You see the real board, imagine one move, and now you keep two pictures apart, the one in front of you and the one in your head.",
            "Each imagined move overwrites a square. Two plies in, four squares have changed, and every piece that did not move has to stay put without any help from your eyes.",
            "That is where a line gets lost. Not on the moving pieces, which have your attention, but on a queen or a pawn that never moved and quietly guards the square you land on.",
            "The usual advice is to look further ahead. The useful advice is to keep the base position steady, because a line is only as long as the picture underneath it.",
          ],
        },
      ],
    },
    {
      id: "two-checks-one-works",
      title: "One position, two knight checks, only one works",
      summary: "Set this up on a real board. White to move.",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "White: king g1, knight d5, pawns f2, g2 and h2. Black: king e8, queen e6, rook a8, pawns f7, g7 and h7. Eleven pieces, one short of the Hard preset.",
            "The black queen on e6 attacks the knight on d5, so White wants a move that gains time. Two knight checks are available, 1.Nc7+ and 1.Nf6+. Compare them two plies deep.",
          ],
        },
        {
          kind: "steps",
          ordered: true,
          items: [
            "Say the first line out loud: 1.Nc7+. Now list what the knight on c7 attacks: a8, e8 and e6. That is the rook, the king and the queen.",
            "Ask which black piece can take on c7. The queen on e6 cannot reach it, the rook on a8 cannot, and the king on e8 is two files away. Black moves the king and loses the queen for a knight.",
            "Say the second line: 1.Nf6+. It also checks the king on e8. Ask the same question. The pawn on g7 takes on f6, and White has given the knight away for nothing.",
            "Play both lines on the board and check. If your answer for 1.Nf6+ was wrong, the piece you dropped was the g7 pawn, which never moved and was never going to.",
          ],
        },
        {
          kind: "callout",
          title: "The question that saves the line",
          body: "After every imagined move, ask who can capture on the square you just landed on. It forces you back to the base position instead of running forward.",
        },
      ],
    },
    {
      id: "empty-board-reset",
      title: "The empty-board reset",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Memory Chess makes you do the hard half of calculation on its own. A position appears for a fixed number of seconds, then the board clears, and you rebuild it while the clock runs.",
            "There is no time limit on the rebuild, but nothing on the empty board reminds you of the queen on e6. That is exactly your state one move into a line, and a round trains it directly.",
            "The positions are made fresh each round and are random rather than taken from games, so a round does not teach you which moves to look at. It trains holding the picture, nothing more.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Hold it while the board is empty",
              description:
                "4 rounds of 8 pieces, 10 seconds, about 5 minutes. Both kings first, then the pieces you are sure of. Stop before you guess, since each extra piece costs ten accuracy points.",
              duration: "About 5 minutes",
              goal: "At least 7 of the 8 correct in three of the four rounds.",
              ctaLabel: "Play 8 pieces, 10 seconds",
              setup: { pieceCount: 8, memorizeTime: 10 },
            },
            {
              title: "Rebuild after the line",
              description:
                "Set the position from the section above on a board. Calculate both checks, then clear the board and set the position again from memory. Compare with a photo you took first.",
              duration: "About 5 minutes",
              goal: "All eleven pieces back on their squares, the g7 pawn included.",
              ctaLabel: "Set it up at your board",
            },
            {
              title: "Two candidates, one sentence each",
              description:
                "Take any position from a game you lost. Pick two moves, follow each for two plies, and finish each with one sentence: what changed, and who guards the landing square.",
              duration: "About 10 minutes",
              goal: "Two lines you can say out loud without looking at the board.",
              ctaLabel: "Use your last lost game",
            },
          ],
        },
      ],
    },
    {
      id: "how-many-lines-to-hold",
      title: "How many lines a beginner should hold",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Two. Not because two is a special number but because the third line is the one that overwrites the first.",
            "Spend working memory on defenders, not on more candidates. Spread it across five candidate moves, and none of them gets the check for defenders.",
            "Add a third candidate only when both of the first two fail for a reason you can state. Keep the depth at two plies until the base position stops drifting.",
            "When the two moves are both checks or both captures, the comparison is quick, so look for a missed defender before a missed idea.",
          ],
        },
        {
          kind: "comparison",
          columns: ["Where it failed", "What it felt like", "What actually happened"],
          rows: [
            {
              label: "The landing square",
              struggling: "The move looked safe.",
              stronger: "A piece that never moved guards it, like the g7 pawn covering f6.",
            },
            {
              label: "Move order",
              struggling: "Both lines blurred into each other.",
              stronger: "You calculated the second line on top of the first instead of on the base position.",
            },
            {
              label: "Depth",
              struggling: "Three plies in, nothing was clear.",
              stronger: "The first two plies were never checked, so the third had nothing to stand on.",
            },
          ],
        },
      ],
    },
    {
      id: "checking-out-loud",
      title: "Say it, then check it on the board",
      blocks: [
        {
          kind: "steps",
          ordered: false,
          items: [
            "Say the line in full, your move and the reply, before you touch a piece.",
            "Name the attackers and defenders of the landing square before you imagine the next move.",
            "Play the line on a real board or an analysis board and compare. Label the miss: a piece you forgot, a move order you swapped, or a judgment you got wrong.",
            "If the miss was a forgotten piece, that is a base-position problem. Play a round of the empty-board reset, not another puzzle.",
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: "How many moves ahead should a beginner calculate?",
      answer:
        "Two plies, your move and the reply, checked for defenders each time. Depth comes from holding the position steady, not from ambition.",
    },
    {
      question: "Does Memory Chess teach calculation?",
      answer:
        "No. It trains the part of calculation that fails first, keeping a position steady when nothing on the board reminds you of it. Choosing moves is learned at the board.",
    },
    {
      question: "Why do I forget a piece that never moved?",
      answer:
        "Because you were tracking the moving pieces. A still piece has no event attached to it, so the base picture has to carry it, and the base picture is what drifts.",
    },
  ],
  relatedArticles: [
    {
      slug: "chess-memory-training",
      reason: "The ladder for holding more pieces through the empty board.",
    },
    {
      slug: "chess-visualization-exercises",
      reason: "Move pieces in your head before you have to do it under a clock.",
    },
    {
      slug: "how-to-think-in-chess-for-beginners",
      reason: "A move routine that decides which two candidates deserve the calculation.",
    },
  ],
  sources: [],
};

export default guide;
