import type { LearnPosition } from "../positions";
import type { LearnGuide } from "../schema";

const guide: LearnGuide = {
  slug: "blindfold-chess-training-for-beginners",
  goal: "visualization",
  title: "Blindfold Chess Training for Beginners",
  h1: "Blindfold chess training for beginners, in four stages with a pass mark each",
  description:
    "A four-stage route into blindfold chess, from holding two kings without a board to a full game with the score sheet in view.",
  primaryKeyword: "blindfold chess training",
  secondaryKeywords: [
    "blindfold chess for beginners",
    "how to play blindfold chess",
    "mental board training",
    "replay a game without a board",
    "chess focus exercises",
  ],
  ctaLabel: "Play 2 pieces, 10 seconds, kings only",
  quickAnswer:
    "Do not start with a game. Hold two kings without a board, learn the rules a mental board must obey, then replay a short game covered. Play blind only when each stage passes its test.",
  keyTakeaways: [
    "Each stage has a pass mark, so you know when to move on and when to repeat.",
    "The position rules the game enforces double as a checklist for a drifting mental board.",
    "The score sheet is allowed at first. Rebuilding the board from it is the skill.",
    "Scholar's mate is the first replay, because four moves end in a position you can check from memory.",
  ],
  whoThisIsFor: [
    "Players who tried a blindfold game and lost the bishops by move ten.",
    "Players who can follow a game from notation with a board, but not without one.",
  ],
  timeToRead: "8 min read",
  difficulty: "Beginner to Intermediate",
  publishedAt: "2026-03-06T00:00:00.000Z",
  updatedAt: "2026-09-15T00:00:00.000Z",
  sections: [
    {
      id: "why-games-collapse",
      title: "Why a first blindfold game collapses",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "A blindfold game does not fail all at once. It can fail on a single piece, and a piece that has not moved is easy to lose track of. You know where the knights are because you moved them. The bishop on c1 sat still for twelve moves, so it fell out of the picture, and you play as if it is not there.",
            "So the training has to build the board, not the move list. The four stages below go from two pieces to a full game, and each has a test you either pass or repeat.",
          ],
        },
      ],
    },
    {
      id: "stage-one-two-kings",
      title: "Stage one, two kings and nothing else",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "The easiest preset in Memory Chess is 2 pieces, and the position rules guarantee those two are the kings, one of each colour, never on adjacent squares. That makes it the smallest blindfold exercise there is. Two squares, both named, held without a board.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Two kings, eyes shut",
              description:
                "Play 6 rounds of 2 pieces with 10 seconds to look. Say both squares aloud, shut your eyes, name the colour of each square, then open them and place the kings.",
              duration: "About 3 minutes",
              goal: "Hold two named squares without the board in front of you.",
              ctaLabel: "Play 2 pieces, 10 seconds, kings only",
              setup: {
                pieceCount: 2,
                memorizeTime: 10,
              },
            },
          ],
        },
        {
          kind: "paragraphs",
          paragraphs: [
            "The pass mark is six perfect rounds in a row, with both square colours right as well. Do not skip the colours. They let you test your picture in a blindfold game later, because a bishop only ever lives on one colour.",
            "If you cannot name a square's colour without thinking, do the coordinates guide first and come back.",
          ],
        },
      ],
    },
    {
      id: "stage-two-sanity-rules",
      title: "Stage two, rules a mental board must obey",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Every position Memory Chess shows passes a fixed set of checks before it reaches the screen. The same checks catch a drifting mental board. When your imagined position breaks one, the picture is wrong, and you rebuild from the last move you are sure of.",
          ],
        },
        {
          kind: "steps",
          ordered: false,
          items: [
            "Exactly one king of each colour.",
            "The two kings never stand on adjacent squares.",
            "No pawn on the first rank or the eighth. A pawn you picture on e1 is a pawn you lost track of.",
            "A side's two bishops never stand on squares of the same colour. If both of Black's bishops are on dark squares in your head, one of them sits on a wrong square. A bishop never changes colour.",
            "No side has more of a piece than a set holds. Eight pawns, two knights, two bishops, two rooks, one queen. If you count three black knights, your picture has invented one.",
            "Both kings are never in check at once, and a king in check belongs to the side to move.",
          ],
        },
        {
          kind: "paragraphs",
          paragraphs: [
            "Practise the checks on a game you have played. Read the first ten moves from the score, cover the board, and run all six on your picture. Then uncover and count how many pieces sat on the wrong square. The pass mark is a count of zero on two different days.",
            "Real games have one exception to the bishop and piece-count checks, promotion. A promoted pawn can become a second queen, a third knight, or a bishop on its partner's colour. Look for promotions in the move list before you trust those two checks.",
          ],
        },
      ],
    },
    {
      id: "stage-three-covered-replay",
      title: "Stage three, replay a short game under a cloth",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "The first game to replay blind is Scholar's mate, because it is four moves long and ends in a position you can check from memory. 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6 4.Qxf7 mate.",
            "Say each move, then say where every piece that has moved now stands. After move four, White has a queen on f7, a bishop on c4 and a pawn on e4. Black has knights on c6 and f6, a pawn on e5, and a king on e8 with no way out.",
            "Now say why it is mate. The king cannot take on f7 because the bishop on c4 covers that square. d8 holds Black's queen, f8 the bishop and d7 a pawn, and the queen on f7 covers e7. If you can explain that without a board, stage three has started.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Ten moves under the cloth",
              description:
                "Read ten moves of a game you played with the board covered. Name the square of every piece still on the board, then run the stage-two checks before you uncover.",
              duration: "About 6 minutes",
              goal: "Rebuild a full board from a move list with no pieces in front of you.",
              ctaLabel: "Replay ten moves covered",
            },
          ],
        },
        {
          kind: "paragraphs",
          paragraphs: [
            "The pass mark is two clean replays of ten moves on different days. Clean means every piece on its square, not most of them. A single misplaced pawn in a covered replay can become a lost piece in a blind game.",
          ],
        },
      ],
    },
    {
      id: "stage-four-with-score-sheet",
      title: "Stage four, a game with the score sheet in view",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Play against a friend or an engine with the board hidden and the move list visible. The list is not cheating. It is the tool you rebuild from. The rule is that you may read the list only to rebuild after a checklist failure, never to find your next move.",
            "Stop at move 15 the first few times, whatever the position, and set the final position up on a real board from memory. Count the pieces on the wrong square. The pass mark is two games in a row with every piece right at move 15.",
            "After that, play to the end, and only then take the sheet away.",
          ],
        },
      ],
    },
    {
      id: "how-long-each-stage-takes",
      title: "How long each stage takes",
      blocks: [
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
              detail: "Run the six checks on ten covered moves of a game each day until the count of wrong squares reaches zero twice.",
            },
            {
              label: "Stage three",
              duration: "6 minutes a day for two weeks",
              detail: "Scholar's mate first, then ten moves of your own games. Two clean replays on different days to pass.",
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
  faq: [
    {
      question: "Should I also train with the 6-piece or 12-piece presets?",
      answer:
        "Not for blindfold. A game hands you every piece's location through moves you chose, while a random 12-piece position hands you nothing, so it trains recall rather than tracking. Stage one uses 2 pieces because two named squares is the smallest board you can hold, and the rules guarantee they are the kings.",
    },
    {
      question: "Do I need to be a strong player first?",
      answer:
        "No. You need to know how every piece moves and the square names without counting. Stage one assumes nothing else. Stage four assumes you can read notation at reading speed.",
    },
    {
      question: "What if I picture the board from Black's side?",
      answer:
        "Pick one orientation and keep it, even when you play Black. White at the bottom matches the way diagrams print, which makes it the easier default. Switching mid-game is an easy way to lose track of a bishop.",
    },
  ],
  relatedArticles: [
    {
      slug: "chess-visualization-exercises",
      reason: "Start there if a covered board loses pieces after a single move.",
    },
    {
      slug: "chess-coordinates-practice",
      reason: "Square colours and names without counting, which stage one assumes.",
    },
    {
      slug: "chess-calculation-exercises-for-beginners",
      reason: "For keeping the starting position steady two moves into a line.",
    },
  ],
  sources: [],
};

export const positions: LearnPosition[] = [
  {
    id: "scholars-mate",
    sectionId: "stage-three-covered-replay",
    line: ["e4", "e5", "Bc4", "Nc6", "Qh5", "Nf6", "Qxf7#"],
    claims: [
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
];

export default guide;
