import type { LearnDocument } from "../schema";

const guide: LearnDocument = {
  meta: {
    slug: "how-to-stop-blundering-in-chess",
    title: "How to Stop Blundering in Chess",
    searchTitle: "How to Stop Blundering in Chess: A 5-Step Check",
    h1: "How to stop blundering in chess",
    description: "Learn how to stop blundering in chess with a five-step scan before every move, a check for loose pieces, and drills built from your own lost games.",
    group: "board-vision",
    level: "beginner",
    publishedAt: "2026-03-24T00:00:00.000Z",
    updatedAt: "2026-09-15T00:00:00.000Z",
    questions: [
      "How do I stop blundering pieces?",
      "What should I check before every move?",
      "What is a loose piece?",
      "Why do I keep hanging pieces in chess?",
    ],
    keywords: {
      primary: "how to stop blundering in chess",
      secondary: [
        "chess board vision",
        "loose pieces chess",
        "checks captures threats",
        "why do I hang pieces in chess",
        "chess blunder check",
      ],
    },
    featured: true,
  },
  intro: {
    quickAnswer: "Before every move, run a five-step scan in a fixed order. Check what your opponent's last move attacks, list their checks, captures and threats, and find your loose pieces, the undefended ones. Then ask whether your move lands on a defended square and what it stops guarding, and only then look for your own checks and captures.",
    takeaways: [
      "A one-move blunder is a move that only works on the board in your head.",
      "A loose piece has no defender, so list yours before your opponent's check finds one.",
      "Measure the habit with a blunder tally per game, because rating also moves with openings, endgames and pairings.",
    ],
    audience: [
      "Players who solve puzzles well and still lose pieces to a one-move reply.",
      "Anyone who spots the capture only after letting go of the piece.",
      "Beginners told to slow down who found that extra time alone changed nothing.",
    ],
  },
  sections: [
    {
      id: "puzzle-vs-game",
      heading: "Why pieces drop in games and not in puzzles",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "A puzzle tells you two things before you look. There is a tactic, and it is your move. A game tells you neither, so a fork you would find in a puzzle can walk past unseen.",
            "A one-move blunder needs no deep line to avoid. It is a move that works on the board in your head and fails on the board on the table.",
            "The two boards differ in three common ways. The first is the phantom defender, a piece you count on to recapture that cannot legally make that capture.",
            "Put a White bishop on b5, a Black knight on c6, the Black king on e8 and a White pawn on e5, with d7 empty. The pawn has just captured a Black piece on e5. Black counted the knight as its defender and planned to recapture. The knight is pinned to the king, so Nxe5 is illegal and the piece is simply lost.",
          ],
        },
        {
          kind: "board",
          position: {
            id: "phantom-defender",
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
          arrows: [{ from: "b5", to: "e8", kind: "pin" }, { from: "c6", to: "e5", kind: "attack" }],
          marks: [{ square: "c6", kind: "ring" }],
          caption: "Black counted on Nxe5 to recapture, but the bishop on b5 pins the knight to the king on e8.",
        },
        {
          kind: "prose",
          paragraphs: [
            "The second is the forgotten piece, a bishop or rook that has not moved for many moves, so you stop looking at it.",
            "The third is the abandoned job. If the pawn on d2 is the only guard of your knight on c3, pushing d2-d4 leaves the knight loose although the knight never moved.",
          ],
        },
        {
          kind: "board",
          position: {
            id: "abandoned-job-after-d4",
            white: ["Kg1", "Nc3", "d2"],
            black: ["Kg8"],
            unstated: ["g1", "g8"],
            line: ["d4"],
            claims: [{ kind: "attackers", square: "c3", side: "w", from: [] }],
          },
          marks: [{ square: "c3", kind: "ring" }],
          caption: "After d2-d4 the knight on c3 has no defender, although it never moved.",
        },
      ],
      facts: [
        {
          id: "abandoned-job",
          white: ["Kg1", "Nc3", "d2"],
          black: ["Kg8"],
          unstated: ["g1", "g8"],
          claims: [{ kind: "attackers", square: "c3", side: "w", from: ["d2"] }],
        },
      ],
    },
    {
      id: "pre-move-scan",
      heading: "The pre-move scan for checks, captures, threats and loose pieces",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Board vision is a scan you run in the same order before every move. A fixed order means nothing depends on where your eyes happen to land.",
          ],
        },
        {
          kind: "list",
          ordered: true,
          items: [
            "The last move. Name every square the moved piece now attacks, and any line it opened by leaving its old square.",
            "Your opponent's forcing moves. List every check they could give, every capture they could make, and every move that would attack one of your pieces.",
            "Your loose pieces. A loose piece is one with no defender. A pinned defender counts only if it can legally recapture. Name each loose piece by its square, then name any piece attacked more times than it is defended.",
            "Your intended move. Count the piece's defenders on its new square. Then ask what it guarded from its old square and which line it blocked.",
            "Your own forcing moves. Only now look at checks and captures for you, starting with any loose enemy piece.",
          ],
        },
        {
          kind: "takeaway",
          title: "Why loose pieces come before your own ideas",
          body: "A double attack wins material when one of its two targets cannot be saved. Any attack on a loose piece is already a threat, so every loose piece is half a tactic waiting for its second half.",
        },
      ],
    },
    {
      id: "loose-bishop-b4",
      heading: "One queen check against a loose bishop on b4",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Set this up with White to move. White has Kg1, Qd1, Ra1, Rf1, Bc1, Nb1, Nf3 and pawns on a2, b2, f2, g2 and h2.",
            "Black has Ke8, Ra8, Rh8, Bc8, Bb4 and pawns on a7, b7, c7, f7, g7 and h7. No Black piece defends the bishop on b4.",
            "White plays Qa4+. The queen checks along b5, c6 and d7 to the king on e8, and attacks the bishop along the fourth rank.",
          ],
        },
        {
          kind: "board",
          position: {
            id: "loose-bishop-after-qa4",
            white: ["Kg1", "Qd1", "Ra1", "Rf1", "Bc1", "Nb1", "Nf3", "a2", "b2", "f2", "g2", "h2"],
            black: ["Ke8", "Ra8", "Rh8", "Bc8", "Bb4", "a7", "b7", "c7", "f7", "g7", "h7"],
            line: ["Qa4+"],
            claims: [
              { kind: "check" },
              { kind: "attacks", from: "a4", squares: ["b4", "b5", "c6", "d7"] },
              { kind: "replies", nonKing: ["c6", "b5", "Bd7"], then: "Qxb4", undefended: "b4" },
            ],
          },
          arrows: [{ from: "a4", to: "e8", kind: "attack" }, { from: "a4", to: "b4", kind: "attack" }],
          marks: [{ square: "b4", kind: "ring" }],
          caption: "Qa4+ checks along b5, c6 and d7 and attacks the undefended bishop on b4.",
        },
        {
          kind: "prose",
          paragraphs: [
            "Black must answer the check first. Blocking with ...c6, ...b5 or ...Bd7 does not defend b4, and neither does any king move, so Qxb4 follows.",
            "Step four would have warned Black a move earlier. Count the bishop's defenders on b4 before you play it, and there are none.",
          ],
        },
      ],
      facts: [
        {
          id: "loose-bishop",
          white: ["Kg1", "Qd1", "Ra1", "Rf1", "Bc1", "Nb1", "Nf3", "a2", "b2", "f2", "g2", "h2"],
          black: ["Ke8", "Ra8", "Rh8", "Bc8", "Bb4", "a7", "b7", "c7", "f7", "g7", "h7"],
          claims: [
            { kind: "pieceCount", count: 23 },
            { kind: "noCheck" },
            { kind: "attackers", square: "b4", side: "b", from: [] },
          ],
        },
      ],
    },
    {
      id: "invented-pieces",
      heading: "What an invented piece costs in a Memory Chess round",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "A Memory Chess round checks your rebuilt board against the original, one square at a time. A piece scores only when the square, the type and the colour all match.",
            "Placing more pieces than the position held is charged twice. Each piece beyond the count is counted as wrong and also takes ten points off your accuracy.",
            "A wrong piece inside the count costs no more than an empty square, so the extra charge lands only on invented pieces.",
            "That makes a round a clean test of one blunder habit. A seventh piece on a six-piece board is a piece your memory added, the same slip as trusting a defender the real board does not have.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "No seventh piece",
              description: "Play 4 rounds of 6 pieces with 10 seconds to look, pressing Try again on the result screen to keep the settings. Before each submit, count your pieces. If you have more than six, remove the ones you are least sure you saw. You pass when all four rounds go in with six pieces or fewer.",
              duration: "4 rounds, about 4 minutes",
              goal: "Tell a piece you saw from a piece you assumed was there.",
              play: { label: "Play 6 pieces, 10 seconds", pieceCount: 6, memorizeTime: 10 },
            },
          ],
        },
      ],
    },
    {
      id: "own-games-drills",
      heading: "Loose-piece and last-move drills from your own lost games",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Both drills use your own games, because those hold the blunders you actually make.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Loose-piece inventory",
              description: "Set up a middlegame position from one of your games. For each of your pieces, write two numbers: enemy attackers, then your defenders, leaving out any defender pinned so it cannot recapture. Circle each piece with no defenders. Star each piece with more attackers than defenders.",
              duration: "5 minutes",
              goal: "See your loose pieces before an opponent's check lands on one.",
            },
            {
              title: "Last-move replay",
              description: "Replay a game you lost. Before each of your moves, say aloud what the opponent's previous move attacks. Where the answer surprises you, you have found the cause.",
              duration: "10 minutes",
              goal: "Learn what a missed threat looked like one move before it landed.",
            },
          ],
        },
      ],
    },
    {
      id: "blunder-tally",
      heading: "A blunder tally beside every result",
      blocks: [
        {
          kind: "prose",
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
      heading: "With under thirty seconds, scan only the last move",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "On a low clock the full scan will not fit, so keep step one and drop the rest. A piece that just moved has fresh targets, and step one also catches any line it opened.",
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
        label: "Play 6 pieces with 10 seconds to look",
        pieceCount: 6,
        memorizeTime: 10,
      },
      why: "Six pieces with ten seconds to look is where an invented seventh piece first shows up, so count before you submit.",
    },
    {
      kind: "cta",
      target: { kind: "stat", tile: "recentAccuracy", label: "See your recent accuracy" },
      why: "A round with an invented seventh piece shows up as a dip in recent accuracy, so watch it climb back as the count habit sets in.",
    },
    {
      kind: "faq",
      items: [
        {
          question: "Does playing slower stop blunders?",
          answer: "Only when you spend the extra time on a fixed question. A slow think with no checklist mostly goes on your own plan. Spend it on the scan, starting with what the last move attacks, and the extra minutes start catching the replies you used to miss.",
        },
        {
          question: "Do I have to run the whole scan on every move?",
          answer: "Run all five steps after any capture, any check, and any pawn move that opens a line, because those moves change the most squares. On a quiet move, run at least steps one and three, the last move and your loose pieces.",
        },
        {
          question: "Should I leave a square empty in a round when I am not sure?",
          answer: "Place it when the guess keeps you inside the piece count. A guess inside the count costs the same as an empty square, and a right guess scores. A guess that takes you past the count is marked wrong and costs ten accuracy points on top.",
        },
      ],
    },
    {
      kind: "furtherReading",
      items: [
        {
          kind: "guide",
          slug: "why-puzzle-rating-doesnt-transfer-to-games",
          reason: "Explains why the tactics you find in puzzles go missing in games, the gap this scan is meant to close.",
        },
        {
          kind: "guide",
          slug: "how-to-see-the-whole-board-in-chess",
          reason: "Deals with the forgotten piece, the long-range bishop or rook that beats you from the far side.",
        },
        {
          kind: "guide",
          slug: "how-to-think-in-chess-for-beginners",
          reason: "Gives the three questions to ask before every move, with a safety check this scan expands into named squares.",
        },
        {
          kind: "guide",
          slug: "how-to-analyze-chess-games-for-beginners",
          reason: "Shows how to review a lost game so each entry in the tally gets a cause.",
        },
      ],
    },
  ],
};

export default guide;
