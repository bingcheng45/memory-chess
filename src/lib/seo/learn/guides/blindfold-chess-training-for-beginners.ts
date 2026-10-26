import type { LearnDocument } from "../schema";

const guide: LearnDocument = {
  meta: {
    slug: "blindfold-chess-training-for-beginners",
    title: "Blindfold Chess Training for Beginners: 4 Stages",
    h1: "How to learn blindfold chess in four stages, each with a pass mark",
    description: "Plan on about five weeks of blindfold chess training to a first full blind game. Drill 3 to 6 minutes a day for four weeks, then a game every other day.",
    group: "visualization",
    level: "improver",
    publishedAt: "2026-03-06T00:00:00.000Z",
    updatedAt: "2026-10-26T00:00:00.000Z",
    practice: { href: "/blindfold", label: "Practise now in the free blindfold chess trainer" },
    questions: [
      "How do I start playing blindfold chess?",
      "How long does it take to learn blindfold chess?",
      "How do I know my mental chess board is wrong?",
      "How do you play chess blindfolded?",
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
    quickAnswer: "Blindfold chess training runs on a five-week schedule that starts with two kings held without a board, and pass marks decide when you move on. Then learn six checks that catch a drifting mental picture, and replay ten moves of your own games from the move list. Play a full game blind only after each stage passes.",
    takeaways: [
      "Each stage has a pass mark, so you know when to move on and when to repeat.",
      "Six checks that every Memory Chess position passes also catch the worst errors in a mental board that has drifted.",
      "From stage two on, each test makes you name the pieces that never moved, the ones you lose.",
      "Keep the move list in view until a full game comes out clean. Rebuilding from it is the skill.",
    ],
    audience: [
      "Players who tried a blindfold game and lost the bishops by move ten.",
      "Players who can follow a game from notation with a board, but not without one.",
    ],
  },
  sections: [
    {
      id: "how-blindfold-chess-is-played",
      heading: "How to play chess blindfolded",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "In a blindfold game you never see the pieces. You and your opponent call out each move in algebraic notation, such as e4 or Nf3, and you keep the position in your head. Your opponent can sit at a normal board, or someone can move the pieces on a board you cannot see.",
            "Some online sites have a blindfold or hidden-pieces setting that does the same job. The board stays empty while the move list grows. The rules do not change, so a piece you forget is a piece you lose.",
            "So the skill is not seeing through a blindfold. It is naming every square without a board and updating the picture after each move. The four stages below build that in order, and stage four ends with your first full blind game.",
          ],
        },
      ],
    },
    {
      id: "why-games-collapse",
      heading: "Why a first blindfold game collapses",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "A blindfold game often fails on a single piece that has not moved. You know where the knights are because you moved them. The bishop on c1 sat still for twelve moves, so it fell out of the picture, and you play as if it is not there.",
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
            "The easiest preset in Memory Chess is 2 pieces, and the position rules make those two the kings, never on adjacent squares.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Two kings, eyes shut",
              description: "Play 6 rounds of 2 pieces with 10 seconds to look, pressing Try again between rounds. Say both squares aloud, shut your eyes, name the colour of each square, then open them and place the kings.",
              duration: "About 3 minutes",
              goal: "Hold two named squares without the board in front of you.",
              play: { label: "Play 2 pieces, 10 seconds, kings only", pieceCount: 2, memorizeTime: 10 },
            },
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "The pass mark is six perfect rounds in a row on two separate days, with both square colours right as well. Do not skip the colours. A bishop only ever lives on one colour, so colours let you test your picture later.",
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
            "Every position Memory Chess shows passes a fixed set of checks. The same checks catch a drifting mental board. When your imagined position breaks one, the picture is wrong, and you rebuild from the last move you are sure of.",
            "Passing all six does not prove the picture is right. A knight one square off breaks none of them. They catch the gross errors, and stages three and four catch the rest by comparing with the real board.",
          ],
        },
        {
          kind: "list",
          ordered: false,
          items: [
            "Exactly one king of each colour.",
            "The two kings never stand on adjacent squares.",
            "No pawn on the first rank or the eighth. A pawn you picture on e1 is a pawn you lost track of.",
            "A side's two bishops never stand on squares of the same colour. If you picture both of Black's bishops on dark squares, one is misplaced.",
            "No side has more of a piece than a set holds. Eight pawns, two knights, two bishops, two rooks, one queen. If you count three black knights, your picture has invented one.",
            "Both kings are never in check at once, and a king in check belongs to the side to move.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Scholar's mate with no board",
              description: "Stop scrolling here, so the diagram below stays out of sight, and keep no board in front of you. Say 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6 4.Qxf7# aloud, one move at a time. Name the square of all 31 pieces left, run the six checks and say why Black is mated. Then scroll down and compare with the diagram.",
              duration: "About 5 minutes",
              goal: "Every piece named on its square and the mate explained before you look at the diagram.",
            },
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "Scholar's mate is the right first game because it is four moves long and only six pieces move. The other 25 still stand where they started, and those are the ones a blind player drops.",
            "Now say why it is mate. The king on e8 cannot take on f7, because the bishop on c4 covers that square. It cannot step to e7, because the queen on f7 covers it. Black's own queen, bishop and pawn fill d8, f8 and d7. Black's king is in check and it is Black's move, so the last item on the list holds.",
            "The pass mark is a clean run on two different days. Clean means every piece on its square and the mate explained before you look at the diagram.",
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
            "Promotion can break the bishop and piece-count checks in a real game. A pawn can become a third knight or a bishop on its partner's colour, so look for promotions in the move list first.",
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
              description: "Open one of your own games on the site you played it on. Cover the board with a sheet of paper or a sticky note, so only the move list shows. Read the first ten moves for each side, 20 in all. Name the square of every piece still on the board and run the six checks. Then step the site's board to Black's tenth move and count the pieces you placed on a wrong square.",
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
      id: "stage-four-with-move-list",
      heading: "Stage four, a game with the move list in view",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "You rebuild from the list, so keeping it in view is part of the drill.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Fifteen moves with the move list in view",
              description: "Play a friend or an engine. Cover the game board with paper, or turn on the site's blindfold or hidden-pieces setting if it has one. Read the move list after your picture breaks one of the six checks or when unsure where a piece stands, never to find a move. At move 15, set the position up on a real board from memory. Uncover the game board and count the pieces on your real board that stand on a different square.",
              duration: "One game every other day",
              goal: "Every piece on its square at move 15, two games in a row.",
            },
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "Once two games pass at move 15, play your next games to the end with the list still in view. Check the final position on a real board the same way. When one full game comes out clean, play the next one with the list hidden. That is your first full blind game.",
          ],
        },
      ],
    },
    {
      id: "how-long-each-stage-takes",
      heading: "How long it takes to learn blindfold chess",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "The first three stages take about four weeks at 3 to 6 minutes a day. Stage four takes at least another week. You need two clean 15-move games and then one clean full game, playing one game every other day. That puts your first full blind game, a whole game with the list hidden, about five weeks from today.",
            "Five weeks is the schedule, not a floor or a promise. Each stage ends on a pass mark, not a date. If every test passes the first time, the fastest path is about 13 days. That is two days for each of the first three stages, then a game every other day. A stage you fail adds days, so repeat it instead of skipping ahead.",
          ],
        },
        {
          kind: "plan",
          steps: [
            {
              label: "Stage one, week 1",
              duration: "3 minutes a day",
              detail: "Six rounds of 2 pieces, 10 seconds, which are the two kings. Press Try again between rounds, since Next round after a perfect round offers 3 pieces. Move on when all six are perfect in a row, colours included, on two separate days.",
            },
            {
              label: "Stage two, week 2",
              duration: "5 minutes a day",
              detail: "Replay Scholar's mate with no board, name all 31 pieces and run the six checks. Move on when two days come out clean.",
            },
            {
              label: "Stage three, weeks 3 and 4",
              duration: "6 minutes a day",
              detail: "Ten moves each from one of your own games a day. Move on when two different games pass on different days with no piece on a wrong square.",
            },
            {
              label: "Stage four, week 5 on",
              duration: "One game every other day",
              detail: "Fifteen moves with the move list in view. Move on to full games when two in a row come out clean, and to a game with the list hidden after one clean full game.",
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
        label: "Play 2 kings blindfold, from notation only",
        pieceCount: 2,
        memorizeTime: 10,
        blindfold: true,
      },
      why: "Blindfold mode shows the two kings as notation, never on the board, so you picture both squares before placing them.",
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
          answer: "Not for blindfold. In a game you track pieces through moves you chose. A random 12-piece position has no moves to follow, so it trains recall instead. Stage one uses 2 pieces because the rules make them the kings, the smallest board you can hold.",
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
