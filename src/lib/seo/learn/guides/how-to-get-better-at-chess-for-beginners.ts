import type { LearnDocument } from "../schema";

const guide: LearnDocument = {
  meta: {
    slug: "how-to-get-better-at-chess-for-beginners",
    title: "How to Get Better at Chess for Beginners",
    h1: "How to get better at chess for beginners",
    description: "A four-week beginner chess plan for how to get better at chess. Read the whole board, ask one safety question per move, play slow games and log each loss.",
    group: "foundations",
    level: "beginner",
    publishedAt: "2026-03-06T00:00:00.000Z",
    updatedAt: "2026-10-13T00:00:00.000Z",
    questions: [
      "How do I get better at chess as a beginner?",
      "What should a beginner practise first?",
      "Where do beginners actually lose their games?",
      "When should beginners study openings?",
    ],
    keywords: {
      primary: "how to get better at chess",
      secondary: [
        "how to improve at chess",
        "chess improvement plan",
        "beginner chess training",
        "chess routine for beginners",
        "stop hanging pieces in chess",
      ],
    },
    featured: true,
  },
  intro: {
    quickAnswer: "To get better at chess as a beginner, stop giving away pieces before you study openings. Each day, play five short board-reading rounds, then one slow game where you ask one safety question before every move. After the game, write one line about the move that lost material.",
    takeaways: [
      "Add two pieces each week, but only after one session of five perfect rounds at the current count.",
      "One line after each game tells you whether the board reading, the question or the pace failed.",
    ],
    audience: [
      "You know how the pieces move and lose most games to a piece left hanging.",
      "You have watched opening videos and cannot say why you still lose.",
      "You want one order of work, with a clear next step each week.",
    ],
  },
  sections: [
    {
      id: "where-games-go",
      heading: "Where beginner games are actually lost",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "At beginner level, a game usually turns on a piece lost for nothing or for a pawn. One lost knight outweighs anything the opening gave you.",
            "Your knight on f3 is pinned to your queen on d1 by Black's bishop on g4. Black pushes the pawn from e5 to e4, and it attacks the knight. Pawns on d6, f7 and h5 block every queen check and guard the bishop.",
          ],
        },
        {
          kind: "board",
          position: {
            id: "pinned-knight-after-e4",
            white: ["Kg1", "Qd1", "Nf3", "g2"],
            black: ["Kg8", "Bg4", "e5", "d6", "f7", "h5"],
            toMove: "b",
            unstated: ["g1", "g2", "g8"],
            line: ["e4"],
            claims: [
              { kind: "attacks", from: "e4", squares: ["f3"] },
              { kind: "attackers", square: "f3", side: "b", from: ["e4", "g4"] },
            ],
          },
          arrows: [
            { from: "g4", to: "d1", kind: "pin" },
            { from: "e4", to: "f3", kind: "attack" },
          ],
          marks: [{ square: "f3", kind: "ring" }],
          caption: "The pawn on e4 attacks the knight on f3, and the knight cannot leave without exposing the queen on d1 to the bishop on g4.",
        },
        {
          kind: "prose",
          paragraphs: [
            "If the knight stays, the pawn takes it and you get only a pawn back. If the knight steps away, the bishop takes the queen. No opening study fixes that.",
            "Two habits do. You see every piece that is attacked, and you check each move against the reply first.",
          ],
        },
        {
          kind: "takeaway",
          title: "The order this guide follows",
          body: "Board reading first, then the safety question, then slower games, then a line after each game. Openings wait until the first three are automatic.",
        },
      ],
      facts: [
        {
          id: "pinned-knight",
          white: ["Kg1", "Qd1", "Nf3", "g2"],
          black: ["Kg8", "Bg4", "e5", "d6", "f7", "h5"],
          toMove: "b",
          unstated: ["g1", "g2", "g8"],
          claims: [{ kind: "attacks", from: "g4", squares: ["f3"] }],
        },
        {
          id: "pinned-knight-steps-away",
          white: ["Kg1", "Qd1", "Nf3", "g2"],
          black: ["Kg8", "Bg4", "e5", "d6", "f7", "h5"],
          toMove: "b",
          unstated: ["g1", "g2", "g8"],
          line: ["e4", "Nd4"],
          claims: [{ kind: "legal", move: "Bxd1" }],
        },
        {
          id: "pinned-knight-stays",
          white: ["Kg1", "Qd1", "Nf3", "g2"],
          black: ["Kg8", "Bg4", "e5", "d6", "f7", "h5"],
          toMove: "b",
          unstated: ["g1", "g2", "g8"],
          line: ["e4", "Kh1", "exf3", "gxf3"],
          claims: [{ kind: "material", white: "kpq", black: "bkppp" }],
        },
        {
          id: "pinned-knight-queen-counterattack",
          white: ["Kg1", "Qd1", "Nf3", "g2"],
          black: ["Kg8", "Bg4", "e5", "d6", "f7", "h5"],
          toMove: "b",
          unstated: ["g1", "g2", "g8"],
          line: ["e4", "Qd4", "exf3", "Qxg4"],
          claims: [{ kind: "legal", move: "hxg4" }],
        },
      ],
    },
    {
      id: "read-the-board",
      heading: "Stage 1. Hold the whole board in your head",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "A piece usually hangs because nobody looked at it. You studied the piece you were moving, and the rest of the board got no look.",
            "A Memory Chess round trains the opposite habit. It shows a position for a fixed number of seconds, clears the board and asks you to rebuild it. A piece counts as correct only when its square, its type and its colour all match.",
            "Guessing does not help, because extra pieces cost points. Put five pieces on a 4-piece round and ten points come off your accuracy, however many of the five are right.",
            "Start at 4 pieces and add two at a time, keeping the look at 10 seconds. Every position has both kings, so a 4-piece round is two kings and two other pieces.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Four pieces, read out loud",
              description: "Play 4 pieces with 10 seconds to look, 5 rounds, pressing Try again between rounds. While the position is up, say each piece and its square out loud, like white knight c3. Then rebuild it.",
              duration: "about 4 minutes",
              goal: "All five rounds at 100 percent in one session before week 2 starts.",
              play: { label: "Play 4 pieces, 10 seconds", pieceCount: 4, memorizeTime: 10 },
            },
            {
              title: "Six pieces, same ten seconds",
              description: "Play 6 pieces with 10 seconds to look, 5 rounds, pressing Try again between rounds. Keep naming every piece aloud, and start with the two kings so they are never the ones you miss.",
              duration: "about 5 minutes",
              goal: "All five rounds at 100 percent in one session before week 3 starts.",
              play: { label: "Play 6 pieces, 10 seconds", pieceCount: 6, memorizeTime: 10 },
            },
            {
              title: "Eight pieces, where this stage stops",
              description: "Play 8 pieces with 10 seconds to look, 5 rounds, pressing Try again between rounds. Naming every piece gets tight here, so name the pairs that attack or guard each other.",
              duration: "about 6 minutes",
              goal: "Most rounds at 100 percent. Eight is as far as this plan goes.",
              play: { label: "Play 8 pieces, 10 seconds", pieceCount: 8, memorizeTime: 10 },
            },
          ],
        },
      ],
    },
    {
      id: "move-question",
      heading: "Stage 2. One question before every move",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "The safety question is always the same. After my move, can my opponent take anything for free, or attack a piece that cannot move away? Ask it on every move, including the quiet ones.",
            "Start from your opponent's last move. Say you are Black after 1.e4 e5. If White plays 2.Bc4, the bishop now looks at f7. If White plays 2.Qh5 instead, the queen looks at f7, e5 and h7.",
            "Then check your own move. The piece you move stops guarding whatever it guarded. Say you answered 2.Qh5 with 2...Nc6. The knight now guards e5, which the queen attacks. If you later move that knight, the pawn on e5 is loose and the queen takes it with check.",
          ],
        },
        {
          kind: "list",
          ordered: true,
          items: [
            "Name your opponent's last move and every new square it attacks.",
            "Pick your move, but keep your hand off the piece.",
            "Ask the safety question about the position after it, including anything your moving piece used to guard.",
            "If the answer is yes, pick again.",
          ],
        },
        {
          kind: "takeaway",
          title: "Why the question works",
          body: "Avoiding a cheap loss needs no long calculation, only a look at the right piece. The question forces that look on every move.",
        },
      ],
      facts: [
        {
          id: "bishop-reaches-c4",
          line: ["e4", "e5", "Bc4"],
          claims: [{ kind: "attacks", from: "c4", squares: ["f7"] }],
        },
        {
          id: "queen-reaches-h5",
          line: ["e4", "e5", "Qh5"],
          claims: [{ kind: "attacks", from: "h5", squares: ["f7", "e5", "h7"] }],
        },
        {
          id: "knight-c6-guards-e5",
          line: ["e4", "e5", "Qh5", "Nc6"],
          claims: [{ kind: "attacks", from: "c6", squares: ["e5"] }],
        },
      ],
    },
    {
      id: "slow-games",
      heading: "Stage 3. Play slow enough to use the question",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Play one game a day with 15 minutes each and 10 seconds added per move, written 15+10, or slower.",
            "A 3-minute game of 40 moves leaves you under 5 seconds a move. While the question is new it takes longer than that, so in blitz you skip it. At 15+10 there is time to ask it on every move.",
          ],
        },
      ],
    },
    {
      id: "one-line",
      heading: "Stage 4. One line after every game",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Skip the full engine review for now. Find the first move where you lost material, and write one line about it. The line names the stage that failed. If you lost nothing, write that instead.",
          ],
        },
        {
          kind: "list",
          ordered: false,
          items: [
            "Stage 1 failed if you never saw the piece that took yours.",
            "Stage 2 failed if you saw it but did not ask the question before moving.",
            "Stage 3 failed if you asked the question and rushed the answer.",
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "Keep the lines in one place. Every ten games, count which stage they name most, and practise that stage next.",
          ],
        },
      ],
    },
    {
      id: "four-weeks",
      heading: "Four weeks in the right order",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Each day has two parts, a few minutes of rounds and one slow game. Move up a count only at the start of a new week, and only if last week's drill goal was met. Otherwise repeat the week.",
          ],
        },
        {
          kind: "plan",
          steps: [
            {
              label: "Week 1",
              duration: "4 minutes plus one slow game",
              detail: "Five rounds of 4 pieces, 10 seconds, with Try again between rounds and each piece named out loud. Then one 15+10 game with the question asked before every move, and one line afterwards.",
            },
            {
              label: "Week 2",
              duration: "5 minutes plus one slow game",
              detail: "Five rounds of 6 pieces, 10 seconds, with Try again between rounds. Same game, same question. Read your week 1 lines before you play.",
            },
            {
              label: "Week 3",
              duration: "6 minutes plus one slow game",
              detail: "Five rounds of 8 pieces, 10 seconds, with Try again between rounds, naming the pairs that attack or guard each other. Same game, question and line.",
            },
            {
              label: "Week 4",
              duration: "6 minutes plus one slow game",
              detail: "Keep the 8-piece rounds. Count your lines by stage. Whichever stage appears most is your first job next month.",
            },
          ],
        },
      ],
    },
    {
      id: "openings-last",
      heading: "When should beginners study openings?",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Start once a full week of games goes by with no material given away. Before that, a memorised line only takes you to move ten in a position you cannot yet read.",
            "Keep the first repertoire small. As White, play 1.e4 and bring the knights out before the bishops. As Black, answer 1.e4 with 1...e5 and 1.d4 with 1...d5.",
            "Learn why each move is played before you learn the next one. When your opponent leaves the book, the reasons are all you have left.",
          ],
        },
      ],
    },
  ],
  end: [
    {
      kind: "cta",
      target: { kind: "game", label: "Play 4 pieces, 10 seconds", pieceCount: 4, memorizeTime: 10 },
      why: "Four pieces is the first rung of the board-reading habit. Look, rebuild, and only then think about a move.",
    },
    {
      kind: "faq",
      items: [
        {
          question: "How long before this shows up in my rating?",
          answer: "Rating moves slowly and depends on who you are paired with, so a week of results tells you little. Look at your last ten stage 4 lines instead and count the games where you lost material. If that count falls, the plan is working.",
        },
        {
          question: "Is Memory Chess enough on its own?",
          answer: "No. A round trains stage 1, reading every piece on the board. It cannot make you ask the safety question against a real clock or show where your own games go wrong. Stages 2 to 4 need real games.",
        },
        {
          question: "Should I do puzzles too?",
          answer: "Yes, a few a day once the slow game is in place. Solve each one slowly and check the opponent's best reply before you commit, which is the safety question again. Allow about one minute per puzzle.",
        },
        {
          question: "What piece count should I stop at?",
          answer: "Eight pieces at 10 seconds is where this plan stops. Past that, extra pieces train memory more than the habit of looking at every piece in your games. The chess memory training guide takes the ladder up to 12 pieces.",
        },
      ],
    },
    {
      kind: "furtherReading",
      items: [
        {
          kind: "guide",
          slug: "how-to-stop-blundering-in-chess",
          reason: "A longer checklist for stage 2 once the single question is automatic.",
        },
        {
          kind: "guide",
          slug: "how-to-think-in-chess-for-beginners",
          reason: "Adds a plan for the move on top of the safety question once it runs without effort.",
        },
        {
          kind: "guide",
          slug: "how-to-analyze-chess-games-for-beginners",
          reason: "Turns the one line from stage 4 into a ten-minute review.",
        },
        {
          kind: "guide",
          slug: "chess-memory-training",
          reason: "The board-reading ladder past eight pieces, for players who enjoy the rounds.",
        },
        {
          kind: "guide",
          slug: "how-many-chess-puzzles-a-day",
          reason: "How to size the puzzle habit that sits beside these stages.",
        },
        {
          kind: "guide",
          slug: "20-minute-daily-chess-study-plan",
          reason: "Fits the four stages into one fixed twenty-minute session for days with no time for a slow game.",
        },
      ],
    },
  ],
};

export default guide;
