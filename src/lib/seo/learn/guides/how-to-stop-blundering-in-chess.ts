import type { LearnPosition } from "../positions";
import type { LearnGuide } from "../schema";

const guide: LearnGuide = {
  slug: "how-to-stop-blundering-in-chess",
  goal: "reduce-blunders",
  title: "How to Stop Blundering in Chess",
  h1: "How to stop blundering in chess",
  description: "Why pieces drop in games and not in puzzles, a pre-move scan for checks, captures, threats and loose pieces, and drills built from your own losses.",
  primaryKeyword: "how to stop blundering in chess",
  secondaryKeywords: [
    "chess board vision",
    "loose pieces chess",
    "checks captures threats",
    "why do I hang pieces in chess",
    "chess blunder check",
  ],
  ctaLabel: "Play 6 pieces with 10 seconds to look",
  quickAnswer: "Before every move, run one scan in a fixed order. Ask what the last move attacks, what checks, captures and threats your opponent has, which of your pieces is loose, and what your move stops guarding.",
  keyTakeaways: [
    "A one-move blunder happens when the board in your head and the board on the table disagree.",
    "A loose piece is the easiest target on the board, so list your loose pieces before your opponent's check finds one.",
    "Keep a blunder tally per game, because rating also moves with openings, endgames and pairings.",
  ],
  whoThisIsFor: [
    "Players who solve puzzles well and still lose pieces to a one-move reply.",
    "Anyone who spots the capture only after letting go of the piece.",
    "Beginners told to slow down who found that extra time alone changed nothing.",
  ],
  timeToRead: "7 min read",
  difficulty: "Beginner",
  featured: true,
  publishedAt: "2026-03-24T00:00:00.000Z",
  updatedAt: "2026-09-15T00:00:00.000Z",
  sections: [
    {
      id: "puzzle-vs-game",
      title: "Why pieces drop in games and not in puzzles",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "A puzzle tells you two things before you look. There is a tactic, and it is your move. A game tells you neither, so a fork you would find in a puzzle walks past unseen.",
            "A one-move blunder needs no deep line to avoid. It happens when the board in your head and the board on the table disagree, and you play a move that only works on the wrong one.",
            "The disagreement takes three common shapes. The first is the phantom defender, a piece that looks like a guard and cannot act as one.",
            "Put a White bishop on b5, a Black knight on c6 and the Black king on e8, with d7 empty. The knight seems to guard e5, but it is pinned and cannot legally capture there.",
            "The second is the forgotten piece, a bishop or rook that has not moved for many moves, so your eye stopped returning to it.",
            "The third is the abandoned job. If the pawn on d2 is the only guard of your knight on c3, pushing d2-d4 leaves the knight loose although the knight never moved.",
          ],
        },
      ],
    },
    {
      id: "pre-move-scan",
      title: "The pre-move scan for checks, captures, threats and loose pieces",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Board vision is less a talent than a scan run in the same order before every move. A fixed order means nothing depends on where your eyes happen to land.",
          ],
        },
        {
          kind: "steps",
          ordered: true,
          items: [
            "The last move. Name every square the moved piece now attacks, and any line it opened by leaving its old square.",
            "Your opponent's forcing moves. List every check they could give, every capture they could make, and every move that would attack one of your pieces.",
            "Your loose pieces. Find each piece with no defender, and each piece attacked more times than it is defended. Say the squares, not a feeling.",
            "Your intended move. Picture the piece gone from its square, then ask what it was guarding and which line it was blocking.",
            "Your own forcing moves. Only now look at checks and captures for you, starting with any loose enemy piece.",
          ],
        },
        {
          kind: "callout",
          title: "Why loose pieces come before your own ideas",
          body: "A double attack wins material when one of its two targets cannot be saved. Any attack on a loose piece is already a threat, so every loose piece is half a tactic waiting for its second half.",
        },
      ],
    },
    {
      id: "loose-bishop-b4",
      title: "One queen check against a loose bishop on b4",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Set this up with White to move. White has Kg1, Qd1, Ra1, Rf1, Bc1, Nb1, Nf3 and pawns on a2, b2, f2, g2 and h2.",
            "Black has Ke8, Ra8, Rh8, Bc8, Bb4 and pawns on a7, b7, c7, f7, g7 and h7. No Black piece defends the bishop on b4.",
            "White plays Qa4+. The queen checks along b5, c6 and d7 to the king on e8, and attacks the bishop along the fourth rank.",
            "Black must answer the check first. Blocking with ...c6, ...b5 or ...Bd7 does not defend b4, and neither does any king move, so Qxb4 follows.",
            "The scan would have warned Black before the bishop ever reached b4. Run step three on the position after ...Bb4, and it finds the bishop loose, with no Black piece defending it.",
          ],
        },
      ],
    },
    {
      id: "invented-pieces",
      title: "What an invented piece costs in a Memory Chess round",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "A Memory Chess round checks your rebuilt board against the original, one square at a time. A piece scores only when the square, the type and the colour all match.",
            "Placing more pieces than the position held is charged twice. Each piece beyond the count is counted as wrong and also takes ten points off your accuracy.",
            "A wrong piece inside the count costs no more than an empty square. Either way one original piece goes unreproduced, so the extra charge lands only on invented pieces.",
            "That makes a round a clean test of one blunder habit. A seventh piece on a six-piece board is a piece your memory added, the phantom defender in miniature.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "No seventh piece",
              description: "Play 4 rounds of 6 pieces with 10 seconds to look, and replay the same settings from the result screen. Before each submit, count your pieces. If there are seven, remove the one you are least sure you saw.",
              duration: "4 rounds, about 4 minutes",
              goal: "Tell a piece you saw from a piece you assumed was there.",
              ctaLabel: "Play 6 pieces, 10 seconds",
              setup: {
                pieceCount: 6,
                memorizeTime: 10,
              },
            },
          ],
        },
      ],
    },
    {
      id: "own-games-drills",
      title: "Loose-piece and last-move drills from your own lost games",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Both drills use positions from your own games, because the blunders worth studying are the ones you actually make.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Loose-piece inventory",
              description: "Set up a middlegame position from one of your games. For each of your pieces, write how many enemy pieces attack it and how many of yours defend it. Circle every zero.",
              duration: "5 minutes",
              goal: "See your loose pieces before an opponent's check lands on one.",
              ctaLabel: "Take the inventory",
            },
            {
              title: "Last-move replay",
              description: "Replay a game you lost. Before each of your moves, say aloud what the opponent's previous move attacks. Where the answer surprises you, you have found the cause.",
              duration: "10 minutes",
              goal: "Learn what a missed threat looked like one move before it landed.",
              ctaLabel: "Replay the last move",
            },
          ],
        },
      ],
    },
    {
      id: "blunder-tally",
      title: "A blunder tally beside every result",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "For the tally, a blunder is a move that loses a pawn or more to a reply one or two moves deep. A slow positional slide does not count, because no scan would catch it.",
            "Write the number next to each result, wins included. Count the move even when your opponent missed the reply, because the habit being measured is yours.",
            "Rating is a poor gauge of this one habit. It moves with your openings, your endgames and your pairings too, while the tally moves only with the scan.",
          ],
        },
      ],
    },
    {
      id: "low-clock-scan",
      title: "With under thirty seconds, scan only the last move",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "On a low clock the full scan will not fit, so keep step one and drop the rest. A piece that just moved has fresh targets, and step one also catches any line it opened.",
            "This is also why the advice to play slower fails on its own. Extra time with no question to answer goes into admiring the move you already wanted.",
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: "Why do I blunder more in games than in puzzles?",
      answer: "A puzzle announces that a tactic exists and whose move it is, so you search. A game announces nothing, so the searching has to be a habit you bring.",
    },
    {
      question: "Do I have to run the whole scan on every move?",
      answer: "Run all five steps after any capture, any check, and any pawn move that opens a line. On a quiet move, steps one and three are the minimum.",
    },
    {
      question: "Should I leave a square empty in a round when I am not sure?",
      answer: "A guess inside the piece count costs the same as an empty square, and a right guess scores. A guess that takes you past the count costs ten accuracy points on top.",
    },
  ],
  relatedArticles: [
    {
      slug: "why-puzzle-rating-doesnt-transfer-to-games",
      reason: "Explains why the tactics you find in puzzles go missing in games, the gap this scan is meant to close.",
    },
    {
      slug: "how-to-see-the-whole-board-in-chess",
      reason: "Deals with the forgotten piece, the long-range bishop or rook that beats you from the far side.",
    },
    {
      slug: "how-to-analyze-chess-games-for-beginners",
      reason: "Shows how to review a lost game so each entry in the tally gets a cause.",
    },
  ],
  sources: [],
};

const LOOSE_BISHOP_WHITE = ["Kg1", "Qd1", "Ra1", "Rf1", "Bc1", "Nb1", "Nf3", "a2", "b2", "f2", "g2", "h2"];
const LOOSE_BISHOP_BLACK = ["Ke8", "Ra8", "Rh8", "Bc8", "Bb4", "a7", "b7", "c7", "f7", "g7", "h7"];

export const positions: LearnPosition[] = [
  {
    id: "phantom-defender",
    sectionId: "puzzle-vs-game",
    white: ["Bb5", "Kg1", "e5"],
    black: ["Nc6", "Ke8"],
    toMove: "b",
    unstated: ["g1"],
    claims: [
      { kind: "occupant", square: "d7", piece: null },
      { kind: "attacks", from: "c6", squares: ["e5"] },
      { kind: "illegal", move: "Nxe5" },
    ],
  },
  {
    id: "abandoned-job",
    sectionId: "puzzle-vs-game",
    white: ["Kg1", "Nc3", "d2"],
    black: ["Kg8"],
    unstated: ["g1", "g8"],
    claims: [{ kind: "attackers", square: "c3", side: "w", from: ["d2"] }],
  },
  {
    id: "abandoned-job-after-d4",
    sectionId: "puzzle-vs-game",
    white: ["Kg1", "Nc3", "d2"],
    black: ["Kg8"],
    unstated: ["g1", "g8"],
    line: ["d4"],
    claims: [{ kind: "attackers", square: "c3", side: "w", from: [] }],
  },
  {
    id: "loose-bishop",
    sectionId: "loose-bishop-b4",
    white: LOOSE_BISHOP_WHITE,
    black: LOOSE_BISHOP_BLACK,
    claims: [
      { kind: "pieceCount", count: 23 },
      { kind: "noCheck" },
      { kind: "attackers", square: "b4", side: "b", from: [] },
    ],
  },
  {
    id: "loose-bishop-after-qa4",
    sectionId: "loose-bishop-b4",
    white: LOOSE_BISHOP_WHITE,
    black: LOOSE_BISHOP_BLACK,
    line: ["Qa4+"],
    claims: [
      { kind: "check" },
      { kind: "attacks", from: "a4", squares: ["b4", "b5", "c6", "d7"] },
      { kind: "replies", nonKing: ["c6", "b5", "Bd7"], then: "Qxb4", undefended: "b4" },
    ],
  },
];

export default guide;
