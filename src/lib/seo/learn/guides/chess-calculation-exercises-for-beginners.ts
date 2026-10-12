import type { LearnDocument } from "../schema";

const guide: LearnDocument = {
  meta: {
    slug: "chess-calculation-exercises-for-beginners",
    title: "Chess Calculation Exercises for Beginners: Two Plies Deep",
    h1: "Chess calculation exercises for beginners who lose the board after two moves",
    description: "Chess calculation exercises for beginners: compare two candidate moves two plies deep, ask who can capture on each landing square, then check on a board.",
    group: "visualization",
    level: "improver",
    publishedAt: "2026-03-24T00:00:00.000Z",
    updatedAt: "2026-10-13T00:00:00.000Z",
    questions: [
      "What are good chess calculation exercises for beginners?",
      "How do I calculate moves ahead in chess?",
      "Why do I lose the board after two moves?",
    ],
    keywords: {
      primary: "chess calculation exercises",
      secondary: [
        "beginner chess calculation",
        "calculate moves ahead chess",
        "candidate move practice",
        "hold a position in your head",
        "working memory for chess",
      ],
    },
  },
  intro: {
    quickAnswer: "Good chess calculation exercises for beginners are short. Pick two candidate moves and follow each for two plies, your move and the reply. After every imagined move, ask which enemy piece can capture on the square you landed on. Say each line out loud, then play it on a real board to check.",
    takeaways: [
      "Two candidate moves, two plies each, is a full calculation for one decision.",
      "A line usually breaks at a piece that never moved, so suspect the starting position before the moves.",
      "Label every miss as a forgotten defender, mixed lines or too deep, and train the one you make most.",
      "An empty-board rebuild trains the base picture that every calculated line stands on.",
    ],
    audience: [
      "Players who imagine a move and then cannot say where the defenders are.",
      "Beginners who play the first move they see in sharp positions.",
      "Anyone who has been told to calculate and never told what to hold in mind.",
    ],
  },
  sections: [
    {
      id: "where-a-line-breaks",
      heading: "Why a calculated line falls apart after two moves",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Calculating means holding a position that is not on the board. You look at the real board, imagine one move, and now keep two pictures apart, the board in front of you and the one in your head.",
            "Each imagined move changes two squares, the one a piece leaves and the one it lands on. Two plies in, four squares differ from the real board. Every other piece has to stay put with no help from your eyes.",
            "The moving pieces hold your attention. The line breaks on a piece that stood still, a pawn or a queen that quietly guards the square you land on. A line can only run as far as the picture underneath it holds.",
            "If pieces slip out of your picture before you move anything, the problem comes earlier than calculation. Start with the visualization exercises linked at the end, then come back here.",
          ],
        },
      ],
    },
    {
      id: "two-checks-one-works",
      heading: "One position, two knight checks, only one works",
      summary: "Set this up on a real board. White to move.",
      blocks: [
        {
          kind: "board",
          position: {
            id: "two-checks",
            white: ["Kg1", "Nd5", "f2", "g2", "h3"],
            black: ["Ke8", "Qb5", "Ra8", "f7", "g7", "h7"],
            claims: [
              { kind: "pieceCount", count: 11 },
              { kind: "noCheck" },
              { kind: "attacks", from: "b5", squares: ["d5"] },
              { kind: "attackers", square: "f6", side: "b", from: ["g7"] },
            ],
          },
          arrows: [{ from: "b5", to: "d5", kind: "attack" }],
          marks: [
            { square: "c7", kind: "ring" },
            { square: "f6", kind: "ring" },
          ],
          caption: "White to move: the queen attacks the knight on d5, and the knight can check from c7 or f6.",
        },
        {
          kind: "prose",
          paragraphs: [
            "White has king g1, knight d5 and pawns on f2, g2 and h3. Black has king e8, queen b5, rook a8 and pawns on f7, g7 and h7. Eleven pieces, one short of the Hard preset.",
            "The queen on b5 attacks the knight along the fifth rank, so White wants a move that gains time. Two knight checks do that, 1.Nc7+ and 1.Nf6+. Compare them two plies deep without moving a piece.",
          ],
        },
        {
          kind: "list",
          ordered: true,
          items: [
            "Say the first line out loud, 1.Nc7+. List what the knight on c7 attacks: a8, b5 and e8. That is the rook, the queen and the king.",
            "Ask which black piece can capture on c7. The queen on b5 cannot reach it, nor can the rook on a8, and the king on e8 is not next to it. Black must move the king, and 2.Nxb5 takes the queen for free.",
            "Say the second line, 1.Nf6+. It also checks the king on e8. Ask the same question. The pawn on g7 reaches f6, so 1...gxf6 wins the knight for nothing.",
            "Now play both lines on the board. If you judged 1.Nf6+ safe, the piece you lost was the g7 pawn, which never moved.",
          ],
        },
        {
          kind: "takeaway",
          title: "The question that saves the line",
          body: "After every imagined move, ask who can capture on the square you just landed on. It sends you back to the base position before you run further ahead.",
        },
      ],
      facts: [
        {
          id: "two-checks-after-nc7",
          white: ["Kg1", "Nd5", "f2", "g2", "h3"],
          black: ["Ke8", "Qb5", "Ra8", "f7", "g7", "h7"],
          line: ["Nc7+"],
          claims: [
            { kind: "check" },
            { kind: "attacks", from: "c7", squares: ["a8", "e8", "b5"] },
            { kind: "attackers", square: "c7", side: "b", from: [] },
            { kind: "replies", nonKing: [], then: "Nxb5", undefended: "b5" },
          ],
        },
        {
          id: "two-checks-after-nf6",
          white: ["Kg1", "Nd5", "f2", "g2", "h3"],
          black: ["Ke8", "Qb5", "Ra8", "f7", "g7", "h7"],
          line: ["Nf6+"],
          claims: [{ kind: "check" }, { kind: "legal", move: "gxf6" }],
        },
        {
          id: "two-checks-after-gxf6",
          white: ["Kg1", "Nd5", "f2", "g2", "h3"],
          black: ["Ke8", "Qb5", "Ra8", "f7", "g7", "h7"],
          line: ["Nf6+", "gxf6"],
          claims: [{ kind: "attackers", square: "f6", side: "w", from: [] }],
        },
      ],
    },
    {
      id: "how-many-lines-to-hold",
      heading: "How many candidate moves a beginner should calculate",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Two. Each extra line is one more picture to keep apart from the base position, so start with the fewest that still give you a comparison.",
            "Spend your attention on defenders. Five candidates mean five landing squares to check, and those checks are where beginner lines go wrong.",
            "Add a third candidate only when both of the first two fail for a reason you can say. Stay at two plies until the base position stops drifting.",
            "When a line still fails, it usually fails in one of three places. The table names them, and the next section uses those names.",
          ],
        },
        {
          kind: "table",
          columns: ["Where the line broke", "What it felt like", "What happened"],
          rows: [
            {
              label: "A forgotten defender",
              cells: [
                "The landing square looked safe.",
                "A piece that never moved guarded it, like the g7 pawn covering f6.",
              ],
            },
            {
              label: "Mixed lines",
              cells: [
                "The two lines blurred into one.",
                "You calculated the second line from the end of the first instead of from the starting position.",
              ],
            },
            {
              label: "Too deep",
              cells: [
                "Three plies in, nothing was clear.",
                "The first two plies were never checked, so the third had nothing to stand on.",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "checking-out-loud",
      heading: "Check every calculated line on a real board",
      blocks: [
        {
          kind: "list",
          ordered: true,
          items: [
            "Say the line in full, your move and the reply, before you touch a piece.",
            "Name every piece that attacks or defends the landing square before you imagine the next move.",
            "Play the line on a real board or an analysis board. Label any miss with a name from the table: forgotten defender, mixed lines or too deep.",
            "Count the labels after a week. If most are forgotten defenders, the base position is the problem, so add the empty-board rounds below.",
          ],
        },
      ],
    },
    {
      id: "empty-board-reset",
      heading: "Train the base position with an empty-board rebuild",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "A Memory Chess round isolates the part of calculation that fails first. A position appears for a fixed number of seconds, then the board clears and you put every piece back.",
            "Nothing on the empty board reminds you of the queen on b5. One move into a line you face the same task, holding pieces the board in front of you no longer shows. The rebuild has no time limit, so the round tests the picture alone.",
            "Positions are random and fresh each round, so a round will not teach you which moves to look at. The other two drills cover choosing and checking moves.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Hold it while the board is empty",
              description: "4 rounds of 8 pieces, 10 seconds, about 5 minutes. Place both kings first, then the pieces you are sure of. Stop before you guess, since each extra piece costs ten accuracy points.",
              duration: "About 5 minutes",
              goal: "At least 7 of the 8 correct in three of the four rounds.",
              play: { label: "Play 8 pieces, 10 seconds", pieceCount: 8, memorizeTime: 10 },
            },
            {
              title: "Rebuild after the line",
              description: "Set up the knight-check position and photograph it. Calculate both checks without moving a piece. Then clear the board, set the position again from memory and compare it with the photo.",
              duration: "About 5 minutes",
              goal: "All eleven pieces back on their squares, the g7 pawn included.",
            },
            {
              title: "Two candidates, one sentence each",
              description: "Take a position from a game you lost. Pick two moves, follow each for two plies, and end each line with one sentence: what changed, and who guards the landing square.",
              duration: "About 10 minutes",
              goal: "Two lines you can say out loud without looking at the board.",
            },
          ],
        },
      ],
    },
  ],
  end: [
    {
      kind: "cta",
      target: { kind: "game", label: "Open the 8-piece, 10-second round", pieceCount: 8, memorizeTime: 10 },
      why: "Eight pieces is close to the eleven in the knight-check position. Rebuild them cleanly and your base picture is ready for a two-ply line.",
    },
    {
      kind: "faq",
      items: [
        {
          question: "How many moves ahead should a beginner calculate?",
          answer: "Two plies, which means your move and your opponent's reply. Check who can capture on each landing square before you go further. Add a third ply once five lines in a row check out on the board. A deeper line built on a shaky base position fails at the first ply anyway.",
        },
        {
          question: "Does Memory Chess teach calculation?",
          answer: "It trains one part of it, keeping a position steady when nothing on the board reminds you of it. A round does not choose candidate moves or judge where a line ends. You learn those at the board, with exercises like the two knight checks and positions from your own games.",
        },
        {
          question: "Why do I forget a piece that never moved?",
          answer: "Your attention follows the pieces that move, because each move is an event you just pictured. A piece that stands still has no event attached, so only your base picture holds it, and that picture fades while you work on the line. The landing-square question sends you back to look for it.",
        },
      ],
    },
    {
      kind: "furtherReading",
      items: [
        {
          kind: "guide",
          slug: "chess-visualization-exercises",
          reason: "Find out whether pieces vanish, drift or change in your head before you calculate with them.",
        },
        {
          kind: "guide",
          slug: "how-to-think-in-chess-for-beginners",
          reason: "Three questions before every move that give you the two candidates worth calculating.",
        },
        {
          kind: "guide",
          slug: "chess-memory-training",
          reason: "The ladder for holding more pieces through the empty board.",
        },
        {
          kind: "guide",
          slug: "how-to-see-the-whole-board-in-chess",
          reason: "Trace each bishop, rook and queen to the edge, so a long-range defender of your landing square shows up.",
        },
        {
          kind: "guide",
          slug: "how-to-stop-blundering-in-chess",
          reason: "A five-step check to stop blundering in the line you just calculated.",
        },
      ],
    },
  ],
};

export default guide;
