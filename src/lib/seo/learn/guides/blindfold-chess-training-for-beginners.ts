import type { LearnDocument } from "../schema";

const guide: LearnDocument = {
  meta: {
    slug: "blindfold-chess-training-for-beginners",
    title: "Blindfold Chess Training for Beginners: A 4-Stage Plan",
    h1: "Blindfold chess training for beginners in four stages, each with a pass mark",
    description: "Blindfold chess training in four stages, from two kings held without a board to a full game, each with a pass mark that tells you when to move on.",
    group: "visualization",
    level: "improver",
    publishedAt: "2026-03-06T00:00:00.000Z",
    updatedAt: "2026-10-13T00:00:00.000Z",
    questions: [
      "How do I start playing blindfold chess?",
      "How long does it take to learn blindfold chess?",
      "How do I know my mental chess board is wrong?",
    ],
    keywords: {
      primary: "blindfold chess training",
      secondary: [
        "blindfold chess for beginners",
        "how to play blindfold chess",
        "mental board training",
        "replay a game without a board",
        "chess focus exercises",
      ],
    },
  },
  intro: {
    quickAnswer: "Blindfold chess training for beginners starts with two kings, not a game. Hold them without a board, learn six checks that catch a wrong mental picture on Scholar's mate, then replay ten moves of your own games from the move list alone. Play a full game blind only after each stage passes its test.",
    takeaways: [
      "Each stage has a pass mark, so you know when to move on and when to repeat.",
      "Six checks that every Memory Chess position passes also catch a mental board that has drifted.",
      "From stage two on, each test makes you name the pieces that never moved, because those are the ones you lose.",
      "Keep the score sheet in view for your first blind games. Rebuilding the board from it is the skill.",
    ],
    audience: [
      "Players who tried a blindfold game and lost the bishops by move ten.",
      "Players who can follow a game from notation with a board, but not without one.",
    ],
  },
  sections: [
    {
      id: "why-games-collapse",
      heading: "Why a first blindfold game collapses",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "A blindfold game does not fail all at once. It can fail on a single piece, and a piece that has not moved is easy to lose track of. You know where the knights are because you moved them. The bishop on c1 sat still for twelve moves, so it fell out of the picture, and you play as if it is not there.",
            "So the training builds the whole board, including the pieces that never move. Each of the four stages below has a test you pass or repeat.",
          ],
        },
      ],
    },
    {
      id: "stage-one-two-kings",
      heading: "Stage one, two kings and nothing else",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "The easiest preset in Memory Chess is 2 pieces, and the position rules guarantee those two are the kings, one of each colour, never on adjacent squares. That makes it the smallest blindfold exercise there is.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Two kings, eyes shut",
              description: "Play 6 rounds of 2 pieces with 10 seconds to look. Say both squares aloud, shut your eyes, name the colour of each square, then open them and place the kings.",
              duration: "About 3 minutes",
              goal: "Hold two named squares without the board in front of you.",
              play: { label: "Play 2 pieces, 10 seconds, kings only", pieceCount: 2, memorizeTime: 10 },
            },
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "The pass mark is six perfect rounds in a row on two separate days, with both square colours right as well. Do not skip the colours. They let you test your picture in a blindfold game later, because a bishop only ever lives on one colour.",
            "If you cannot name a square's colour without thinking, do the coordinates guide first and come back.",
          ],
        },
      ],
    },
    {
      id: "stage-two-sanity-rules",
      heading: "Stage two, six checks that catch a drifting mental board",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Every position Memory Chess shows passes a fixed set of checks before it reaches the screen. The same checks catch a drifting mental board. When your imagined position breaks one, the picture is wrong, and you rebuild from the last move you are sure of.",
          ],
        },
        {
          kind: "list",
          ordered: false,
          items: [
            "Exactly one king of each colour.",
            "The two kings never stand on adjacent squares.",
            "No pawn on the first rank or the eighth. A pawn you picture on e1 is a pawn you lost track of.",
            "A side's two bishops never stand on squares of the same colour. If both of Black's bishops sit on dark squares in your head, one of them is on a wrong square.",
            "No side has more of a piece than a set holds. Eight pawns, two knights, two bishops, two rooks, one queen. If you count three black knights, your picture has invented one.",
            "Both kings are never in check at once, and a king in check belongs to the side to move.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Scholar's mate under a cloth",
              description: "Cover the board and say 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6 4.Qxf7# aloud, one move at a time. Name the square of all 31 pieces left, run the six checks and say why Black is mated. Then compare with the board below.",
              duration: "About 5 minutes",
              goal: "Every piece named on its square and the mate explained before you uncover.",
            },
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "Scholar's mate is the right first game because it is four moves long and only six pieces move. The other 25 still stand where they started, and those are the ones a blind player drops.",
            "Now say why it is mate. The king on e8 cannot take on f7, because the bishop on c4 covers that square. It cannot step to e7, because the queen on f7 covers it. Black's own queen, bishop and pawn fill d8, f8 and d7. Black's king is in check with Black to move, so the sixth check passes.",
            "The pass mark is a clean run on two different days. Clean means every piece on its square and the mate explained without a look.",
          ],
        },
        {
          kind: "board",
          position: {
            id: "scholars-mate",
            line: ["e4", "e5", "Bc4", "Nc6", "Qh5", "Nf6", "Qxf7#"],
            claims: [
              { kind: "pieceCount", count: 31 },
              { kind: "check" },
              { kind: "mate" },
              { kind: "occupant", square: "f7", piece: "wq" },
              { kind: "occupant", square: "c4", piece: "wb" },
              { kind: "occupant", square: "e4", piece: "wp" },
              { kind: "occupant", square: "c6", piece: "bn" },
              { kind: "occupant", square: "f6", piece: "bn" },
              { kind: "occupant", square: "e5", piece: "bp" },
              { kind: "occupant", square: "e8", piece: "bk" },
              { kind: "occupant", square: "d8", piece: "bq" },
              { kind: "occupant", square: "f8", piece: "bb" },
              { kind: "occupant", square: "d7", piece: "bp" },
              { kind: "occupant", square: "e7", piece: null },
              { kind: "attacks", from: "c4", squares: ["f7"] },
              { kind: "attacks", from: "f7", squares: ["e7"] },
            ],
          },
          caption: "After 4.Qxf7#, 31 pieces remain and 25 of them never moved, so check those first.",
        },
        {
          kind: "prose",
          paragraphs: [
            "Real games have one exception to the bishop and piece-count checks, promotion. A promoted pawn can become a second queen, a third knight, or a bishop on its partner's colour. Look for promotions in the move list before you trust those two checks.",
          ],
        },
      ],
    },
    {
      id: "stage-three-covered-replay",
      heading: "Stage three, ten moves of your own game from the move list",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Scholar's mate can be learned by heart. Your own games cannot, so they test whether you rebuild the board from the moves alone.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Ten moves from the move list",
              description: "Open one of your own games on the site you played it on and hide the board, so only the move list shows. Read the first ten moves for each side, 20 in all. Name the square of every piece still on the board and run the six checks. Then step the site's board to Black's tenth move and count the pieces you placed on a wrong square.",
              duration: "About 6 minutes",
              goal: "Zero pieces on a wrong square after ten moves each, with nothing in front of you but the move list.",
            },
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "The pass mark is two clean replays on different days, from different games. One misplaced pawn in a replay can become a lost piece in a blind game.",
          ],
        },
      ],
    },
    {
      id: "stage-four-with-score-sheet",
      heading: "Stage four, a game with the score sheet in view",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Play against a friend or an engine with the board hidden and the move list visible. The list is not cheating. It is the tool you rebuild from. The rule is that you may read the list only to rebuild after a checklist failure, never to find your next move.",
            "Stop at move 15 the first few times and set the position up on a real board from memory. Count the pieces on the wrong square. The pass mark is two games in a row with every piece right at move 15.",
            "After that, play to the end, and only then take the sheet away.",
          ],
        },
      ],
    },
    {
      id: "how-long-each-stage-takes",
      heading: "How long blindfold chess training takes",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "The first three stages take about four weeks on this schedule. A stage you fail takes longer, so repeat it instead of skipping ahead.",
          ],
        },
        {
          kind: "plan",
          steps: [
            {
              label: "Stage one",
              duration: "3 minutes a day for a week",
              detail: "Six perfect two-king rounds in a row, colours included, on two separate days.",
            },
            {
              label: "Stage two",
              duration: "5 minutes a day for a week",
              detail: "Replay Scholar's mate under a cloth, name all 31 pieces and run the six checks, until two days come out clean.",
            },
            {
              label: "Stage three",
              duration: "6 minutes a day for two weeks",
              detail: "Ten moves each from one of your own games a day, until two different games pass on different days.",
            },
            {
              label: "Stage four",
              duration: "One game every other day",
              detail: "Fifteen moves with the sheet in view, checked on a real board, until two games in a row come out clean.",
            },
          ],
        },
      ],
    },
  ],
  end: [
    {
      kind: "cta",
      target: {
        kind: "game",
        label: "Play 2 pieces, 10 seconds, kings only",
        pieceCount: 2,
        memorizeTime: 10,
      },
      why: "Two kings and ten seconds is stage one of the plan: hold both squares with nothing else on the board.",
    },
    {
      kind: "cta",
      target: {
        kind: "article",
        slug: "judit-polgar",
        label: "How Judit Polgár played blindfold chess at age seven",
      },
      why: "Read how Judit Polgár played blindfold at seven, the skill this plan builds one stage at a time.",
    },
    {
      kind: "faq",
      items: [
        {
          question: "Should I also train with the 6-piece or 12-piece presets?",
          answer: "Not for blindfold. In a game you track pieces through moves you chose. A random 12-piece position gives you no moves to follow, so it trains recall instead. Stage one uses 2 pieces because two named squares is the smallest board you can hold, and the rules make them the kings.",
        },
        {
          question: "Do I need to be a strong player first?",
          answer: "No. You need to know how every piece moves and the square names without counting. Stage one assumes nothing else. Stage four assumes you can read notation at reading speed.",
        },
        {
          question: "What if I picture the board from Black's side?",
          answer: "Pick one orientation and keep it, even when you play Black. White at the bottom matches the way diagrams print, which makes it the easier default. Switching mid-game is an easy way to lose track of a bishop.",
        },
      ],
    },
    {
      kind: "furtherReading",
      items: [
        {
          kind: "guide",
          slug: "chess-visualization-exercises",
          reason: "Start there if a covered board loses pieces after a single move.",
        },
        {
          kind: "guide",
          slug: "chess-coordinates-practice",
          reason: "Square colours and names without counting, which stage one assumes.",
        },
        {
          kind: "guide",
          slug: "chess-calculation-exercises-for-beginners",
          reason: "For keeping the starting position steady two moves into a line.",
        },
      ],
    },
  ],
};

export default guide;
