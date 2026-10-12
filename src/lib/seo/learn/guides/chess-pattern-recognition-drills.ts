import type { LearnDocument } from "../schema";

const guide: LearnDocument = {
  meta: {
    slug: "chess-pattern-recognition-drills",
    title: "Chess Pattern Recognition Drills: 4 Shapes to Rebuild",
    h1: "Chess pattern recognition drills for the first four tactics",
    description: "Chess pattern recognition drills for four tactics: the exact squares, the one condition each needs, and a six-minute rebuild routine that makes them stick.",
    group: "memory",
    level: "beginner",
    publishedAt: "2026-03-24T00:00:00.000Z",
    updatedAt: "2026-10-13T00:00:00.000Z",
    questions: [
      "How do I train pattern recognition in chess?",
      "Which chess patterns should beginners learn first?",
      "What does a knight fork look like on the board?",
    ],
    keywords: {
      primary: "chess pattern recognition drills",
      secondary: [
        "pattern recognition chess",
        "chess motifs training",
        "knight fork pattern",
        "back rank mate pattern",
        "chess chunking",
      ],
    },
  },
  intro: {
    quickAnswer: "Chess pattern recognition drills should start with four patterns, the knight fork, back-rank mate, bishop pin and smothered mate, each learned as squares plus one condition. Set the shape up at a board, clear it and rebuild it from memory. Then add one black piece that breaks it, watch the tactic fail, and look for the shape in your own games.",
    takeaways: [
      "A knight fork on c7 is three squares, e8, a8 and c7, plus one condition, that nothing black can take on c7.",
      "Rebuild each shape from an empty board until you can place it without the table, then look for it in your own games.",
      "Memory Chess positions are random. They train fast reading of clusters, and the tactics themselves are learned at a board.",
    ],
    audience: [
      "Players with a decent puzzle rating who still walk into forks in their own games.",
      "Beginners who know the words pin, fork and skewer and could not set one up.",
      "Anyone who reads a 12-piece board one piece at a time.",
    ],
  },
  sections: [
    {
      id: "shape-plus-condition",
      heading: "A pattern is a shape plus one condition",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Start with the knight fork on c7. A black king stands on e8 and a black rook on a8. A white knight lands on c7 and hits both.",
            "That is the shape. The condition is that nothing black can capture on c7. A black queen or bishop on d8 kills the fork, and so does a black knight on b5 or e6.",
            "A puzzle promises the tactic works, so it checks the condition for you. A game leaves that check to you.",
            "So the drill below has two halves. Rebuild the shape from memory, then break the condition on purpose and watch the tactic fail.",
          ],
        },
      ],
      facts: [
        {
          id: "c7-guarded-by-Qd8",
          white: ["Kg1"],
          black: ["Ke8", "Ra8", "Qd8"],
          unstated: ["g1"],
          claims: [{ kind: "attacks", from: "d8", squares: ["c7"] }],
        },
        {
          id: "c7-guarded-by-Bd8",
          white: ["Kg1"],
          black: ["Ke8", "Ra8", "Bd8"],
          unstated: ["g1"],
          claims: [{ kind: "attacks", from: "d8", squares: ["c7"] }],
        },
        {
          id: "c7-guarded-by-Nb5",
          white: ["Kg1"],
          black: ["Ke8", "Ra8", "Nb5"],
          unstated: ["g1"],
          claims: [{ kind: "attacks", from: "b5", squares: ["c7"] }],
        },
        {
          id: "c7-guarded-by-Ne6",
          white: ["Kg1"],
          black: ["Ke8", "Ra8", "Ne6"],
          unstated: ["g1"],
          claims: [{ kind: "attacks", from: "e6", squares: ["c7"] }],
        },
      ],
    },
    {
      id: "four-shapes-with-squares",
      heading: "Four patterns beginners should learn first, square by square",
      blocks: [
        {
          kind: "table",
          columns: ["Pattern", "The shape", "The condition"],
          rows: [
            {
              label: "Knight fork on c7",
              cells: ["Black king e8, black rook a8, white knight on b5 or d5 ready to jump", "No black piece guards c7"],
            },
            {
              label: "Back-rank mate",
              cells: ["Black king g8, black pawns f7, g7 and h7, white rook e1 on an open e-file", "No black piece can take on e8 or block on f8"],
            },
            {
              label: "Bishop pin on b5",
              cells: ["Black king e8, black knight c6, white bishop b5", "d7 is empty, so the knight cannot move without exposing the king"],
            },
            {
              label: "Smothered mate",
              cells: ["Black king h8, black rook g8, black pawns g7 and h7, white knight g5 ready for f7", "No black piece guards f7"],
            },
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "Each condition concerns a square or piece outside the shape, which is why puzzle solvers skip it. In the smothered mate the king's own rook and pawns take its flight squares, so one knight is enough.",
          ],
        },
      ],
      facts: [
        {
          id: "fork-from-d5",
          white: ["Kg1", "Nd5"],
          black: ["Ke8", "Ra8"],
          unstated: ["g1"],
          claims: [{ kind: "attackers", square: "c7", side: "b", from: [] }],
        },
        {
          id: "fork-from-d5-played",
          white: ["Kg1", "Nd5"],
          black: ["Ke8", "Ra8"],
          unstated: ["g1"],
          line: ["Nc7+"],
          claims: [{ kind: "check" }, { kind: "attacks", from: "c7", squares: ["a8", "e8"] }],
        },
        {
          id: "fork-from-b5-played",
          white: ["Kg1", "Nb5"],
          black: ["Ke8", "Ra8"],
          unstated: ["g1"],
          line: ["Nc7+"],
          claims: [{ kind: "check" }, { kind: "attacks", from: "c7", squares: ["a8", "e8"] }],
        },
        {
          id: "back-rank-mate",
          white: ["Kh1", "Re1"],
          black: ["Kg8", "f7", "g7", "h7"],
          unstated: ["h1"],
          line: ["Re8#"],
          claims: [{ kind: "mate" }],
        },
        {
          id: "bishop-pin",
          white: ["Kg1", "Bb5"],
          black: ["Ke8", "Nc6"],
          toMove: "b",
          unstated: ["g1"],
          claims: [{ kind: "occupant", square: "d7", piece: null }, { kind: "immobile", square: "c6" }],
        },
        {
          id: "smothered-mate",
          white: ["Kg1", "Ng5"],
          black: ["Kh8", "Rg8", "g7", "h7"],
          unstated: ["g1"],
          line: ["Nf7#"],
          claims: [{ kind: "mate" }, { kind: "attackers", square: "f7", side: "b", from: [] }],
        },
      ],
    },
    {
      id: "rebuild-shift-break",
      heading: "The rebuild, shift and break drill",
      summary: "One pattern, about 6 minutes at a real board.",
      blocks: [
        {
          kind: "list",
          ordered: true,
          items: [
            "Set up the knight fork from the table with the knight on d5. Look for ten seconds and say the squares aloud: e8, a8, d5 and c7, the square the knight jumps to.",
            "Clear the board completely and set the shape up again from memory. Check it against the table. A piece on the wrong square counts as wrong, the same rule Memory Chess uses.",
            "Shift the whole shape one file to the right: king f8, rook b8, knight e5. The fork square is now d7. Play Nd7+ and confirm the knight hits both, then say why aloud. Nothing black guards d7.",
            "Break the condition. Put a black bishop on c8 and play Nd7+ again. Bxd7 takes the knight, so the fork fails. That bishop is the piece to look for in a game.",
            "Steps 3 and 4 use the fork. For the other three patterns, skip the shift and add one black piece or pawn that breaks the condition. Back-rank mate: a black rook on a8, so Re8+ is met by Rxe8. Smothered mate: a black queen on d7 guarding f7, so Nf7+ is met by Qxf7. Bishop pin: a black pawn on d7, so the c6 knight can move again, for example to e5.",
            "Drill one pattern per session. Once all four rebuild cleanly, open your last three games and look for each shape, even where it never happened. A knight two jumps from a fork square is the shape in its early form.",
          ],
        },
        {
          kind: "board",
          position: {
            id: "fork-shifted-broken",
            white: ["Kg1", "Ne5"],
            black: ["Kf8", "Rb8", "Bc8"],
            unstated: ["g1"],
            claims: [
              { kind: "attacks", from: "c8", squares: ["d7"] },
              { kind: "attacks", from: "e5", squares: ["d7"] },
            ],
          },
          arrows: [
            { from: "e5", to: "d7", kind: "attack" },
            { from: "c8", to: "d7", kind: "defend" },
          ],
          marks: [{ square: "d7", kind: "ring" }],
          caption: "With a black bishop on c8 guarding d7, the shifted fork Nd7+ only loses the knight.",
        },
      ],
      facts: [
        {
          id: "fork-shifted",
          white: ["Kg1", "Ne5"],
          black: ["Kf8", "Rb8"],
          unstated: ["g1"],
          line: ["Nd7+"],
          claims: [{ kind: "check" }, { kind: "attacks", from: "d7", squares: ["b8", "f8"] }],
        },
        {
          id: "fork-shifted-broken-played",
          white: ["Kg1", "Ne5"],
          black: ["Kf8", "Rb8", "Bc8"],
          unstated: ["g1"],
          line: ["Nd7+"],
          claims: [{ kind: "legal", move: "Bxd7" }],
        },
        {
          id: "back-rank-broken-by-Ra8",
          white: ["Kh1", "Re1"],
          black: ["Kg8", "Ra8", "f7", "g7", "h7"],
          unstated: ["h1", "e1", "g8", "f7", "g7", "h7"],
          line: ["Re8+"],
          claims: [{ kind: "legal", move: "Rxe8" }],
        },
        {
          id: "smothered-broken-by-Qd7",
          white: ["Kg1", "Ng5"],
          black: ["Kh8", "Rg8", "Qd7", "g7", "h7"],
          unstated: ["g1", "g5", "h8", "g8", "g7", "h7"],
          line: ["Nf7+"],
          claims: [{ kind: "attackers", square: "f7", side: "b", from: ["d7"] }, { kind: "legal", move: "Qxf7" }],
        },
        {
          id: "pin-broken-by-d7-pawn",
          white: ["Kg1", "Bb5"],
          black: ["Ke8", "Nc6", "d7"],
          toMove: "b",
          unstated: ["g1", "b5", "e8"],
          claims: [{ kind: "legal", move: "Ne5" }],
        },
      ],
    },
    {
      id: "random-boards-and-clusters",
      heading: "Reading a random 12-piece board in clusters",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Memory Chess positions are random and fresh each round, so a back-rank mate shows up only by chance. What a round trains is reading a cluster, two to four pieces that touch or guard each other, as one unit. Twenty pieces in five seconds is a quarter of a second per piece, too little to read square by square.",
            "The generator weights piece types as a real set holds them, eight pawns to one queen per side. On a 12-piece board the ten pieces beyond the kings are split five and five, and about half of them are pawns. So read the kings first, then the pawns that touch, then the odd pieces.",
            "Two more rules shrink the search. A side's two bishops never share a square colour, and no pawn ever stands on the first or eighth rank.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Pawns before pieces",
              description: "3 rounds of 12 pieces, 8 seconds, about 5 minutes. Place the kings, then each pair of touching pawns as one cluster, then the rest. Say each pair aloud, such as f2 g3.",
              duration: "About 5 minutes",
              goal: "Every pawn on its square in all three rounds.",
              play: { label: "Start 12 pieces, 8 seconds", pieceCount: 12, memorizeTime: 8 },
            },
            {
              title: "The quarter-second board",
              description: "2 rounds of 20 pieces, 5 seconds, about 4 minutes. Try it only once 12 pieces at 8 seconds gives you Excellent Memory or Perfect Score, 90 percent or better, in most rounds. Before that, a round is likely to end in Keep Practicing. Watch for the moment you start reading clusters.",
              duration: "About 4 minutes",
              goal: "At least 50 percent on the second round, which the result screen calls Good Effort or better.",
              play: { label: "Try 20 pieces, 5 seconds", pieceCount: 20, memorizeTime: 5 },
            },
          ],
        },
      ],
    },
    {
      id: "recognition-over-search",
      heading: "What Kasparov's simultaneous games showed about recognition",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Gobet and Simon compared Kasparov's simultaneous displays against strong players with his normal games. With a fraction of his usual time per move, his performance dropped only a little. They read that as evidence that recognition carries more of a strong player's strength than deep search.",
            "Calculation still matters for you. The shapes you rebuild tell you which move to calculate first.",
          ],
        },
      ],
    },
  ],
  end: [
    {
      kind: "cta",
      target: { kind: "game", label: "Open the 12-piece, 8-second round", pieceCount: 12, memorizeTime: 8 },
      why: "Read the kings, then the touching pawns, then the rest, and see how many clusters a random twelve-piece board breaks into.",
    },
    {
      kind: "cta",
      target: {
        kind: "article",
        slug: "magnus-carlsen",
        label: "How Magnus Carlsen names a famous game from one position",
      },
      why: "Read how Carlsen names a game from one position, pattern recall at its far end.",
    },
    {
      kind: "faq",
      items: [
        {
          question: "Is pattern recognition the same as memorising puzzles?",
          answer: "No. A memorised puzzle is one position on fixed squares. A pattern is a shape you still recognise when it moves a file or appears for the other colour, plus a condition you check every time you see it.",
        },
        {
          question: "Can Memory Chess show me real tactical patterns?",
          answer: "No. Its positions are random and generated fresh every round, so a fork or a back-rank mate appears only by chance. Use it to read clusters of pieces quickly, and learn the tactical shapes at a real board.",
        },
        {
          question: "How many patterns should I learn at once?",
          answer: "Four is enough to start. Drill one per session until you can rebuild all four from memory. Add a fifth pattern only when you have found each of the four, or its early form, in a game you played.",
        },
      ],
    },
    {
      kind: "furtherReading",
      items: [
        {
          kind: "guide",
          slug: "chess-memory-training",
          reason: "The ladder that gets you to 12 pieces before you try to read them as clusters.",
        },
        {
          kind: "guide",
          slug: "how-to-stop-blundering-in-chess",
          reason: "Turns the condition check into a short scan you run before every move.",
        },
        {
          kind: "guide",
          slug: "why-puzzle-rating-doesnt-transfer-to-games",
          reason: "Why a shape you solve in puzzles goes unseen in your games.",
        },
        {
          kind: "guide",
          slug: "how-many-chess-puzzles-a-day",
          reason: "How many puzzles a day it takes to keep the shapes fresh.",
        },
      ],
    },
    {
      kind: "sources",
      items: [
        {
          title: "The Roles of Recognition Processes and Look-Ahead Search in Time-Constrained Expert Problem Solving: Evidence From Grand-Master-Level Chess",
          note: "Supports the claim that Kasparov's performance with far less time per move in simultaneous displays fell only slightly, read as evidence for recognition over search.",
          url: "https://doi.org/10.1111/j.1467-9280.1996.tb00666.x",
        },
      ],
    },
  ],
};

export default guide;
