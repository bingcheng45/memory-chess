import type { Authored } from "./convertGuide";

/** Per-guide data the template adds. Questions repeating an FAQ question are dropped by convertGuide. */
export const AUTHORED: Readonly<Record<string, Authored>> = {
  "how-to-get-better-at-chess-for-beginners": {
    group: "foundations",
    description:
      "A beginner chess plan for players who know the rules and still lose pieces for free: read the whole board, ask one question per move, write one line.",
    questions: [
      "How do I get better at chess as a beginner?",
      "What should a beginner practise first?",
      "Where do beginners actually lose their games?",
      "When should beginners study openings?",
    ],
    gameWhy: "Four pieces is the first rung of the board-reading habit: look, rebuild, and only then think about a move.",
  },
  "how-to-stop-blundering-in-chess": {
    group: "board-vision",
    questions: [
      "How do I stop blundering pieces?",
      "Why do I blunder more in games than in puzzles?",
      "What should I check before every move?",
      "What is a loose piece?",
    ],
    gameWhy: "Six pieces with ten seconds to look is where an invented seventh piece first shows up, so count before you submit.",
    extraCtas: [
      {
        kind: "cta",
        target: { kind: "stat", tile: "recentAccuracy", label: "See your recent accuracy" },
        why: "A round with an invented seventh piece shows up as a dip in recent accuracy, so watch it climb back as the count habit sets in.",
      },
    ],
    boards: {
      "puzzle-vs-game": [
        {
          position: "phantom-defender",
          after: 3,
          caption: "The knight on c6 seems to guard e5, but the bishop on b5 pins it to the king on e8.",
          arrows: [
            { from: "b5", to: "e8", kind: "pin" },
            { from: "c6", to: "e5", kind: "attack" },
          ],
          marks: [{ square: "c6", kind: "ring" }],
        },
        {
          position: "abandoned-job-after-d4",
          after: 5,
          caption: "After d2-d4 the knight on c3 has no defender, although it never moved.",
          marks: [{ square: "c3", kind: "ring" }],
        },
      ],
      "loose-bishop-b4": [
        {
          position: "loose-bishop-after-qa4",
          after: 2,
          caption: "Qa4+ checks along b5, c6 and d7 and attacks the undefended bishop on b4.",
          arrows: [
            { from: "a4", to: "e8", kind: "attack" },
            { from: "a4", to: "b4", kind: "attack" },
          ],
          marks: [{ square: "b4", kind: "ring" }],
        },
      ],
    },
  },
  "why-puzzle-rating-doesnt-transfer-to-games": {
    group: "board-vision",
    questions: [
      "Why is my puzzle rating higher than my game rating?",
      "Why can I solve puzzles but miss tactics in games?",
      "Do puzzle skills transfer to real games?",
    ],
    gameWhy: "Twelve pieces in eight seconds is a fresh board with no hint about what matters, the condition a puzzle never sets.",
  },
  "chess-coordinates-practice": {
    group: "board-vision",
    questions: [
      "How do I learn chess coordinates fast?",
      "How do I know a square's colour without looking?",
      "Should I practise coordinates from Black's side?",
      "How do I read squares without counting?",
    ],
    gameWhy: "Four pieces with twelve seconds leaves time to say each square's name aloud before you place the piece.",
  },
  "chess-visualization-exercises": {
    group: "visualization",
    description:
      "Visualization drills for players who lose the position two moves into a line, with a four-minute check for pieces that vanish, drift or change identity.",
    questions: [
      "How do I improve chess visualization?",
      "Why does the position fade two moves into a line?",
      "What is the cover-and-move drill?",
      "How long does visualization training take?",
    ],
    gameWhy: "Four rounds at six pieces show whether your pieces vanish, drift a square or change identity on the way back.",
  },
  "how-to-see-the-whole-board-in-chess": {
    group: "board-vision",
    questions: [
      "How do I see the whole board?",
      "How do I stop tunnel vision in chess?",
      "Why do I miss long-range bishops and rooks?",
    ],
    gameWhy: "Twelve pieces spread over the whole board, so a round you finish short usually lost a piece near an edge.",
  },
  "chess-calculation-exercises-for-beginners": {
    group: "visualization",
    questions: [
      "How do I calculate moves ahead?",
      "How many moves ahead should a beginner calculate?",
      "Why do I lose the board after two moves?",
      "Does Memory Chess teach calculation?",
    ],
    gameWhy: "Eight pieces is enough material for a two-move line, and rebuilding it first tells you the starting position was right.",
  },
  "blindfold-chess-training-for-beginners": {
    group: "visualization",
    questions: [
      "How do I start playing blindfold chess?",
      "Do I need to be strong to train blindfold?",
      "How long does each blindfold stage take?",
    ],
    gameWhy: "Two kings and ten seconds is stage one of the plan: hold both squares with nothing else on the board.",
    articles: {
      "judit-polgar": {
        label: "How Judit Polgár played blindfold chess at age seven",
        why: "Read how Judit Polgár played blindfold at seven, the skill this plan builds one stage at a time.",
      },
    },
  },
  "chess-memory-training": {
    group: "memory",
    questions: [
      "How do I train my chess memory?",
      "Is 6 pieces in 10 seconds a good score?",
      "When should I add more pieces to a round?",
      "Does the leaderboard care about speed?",
    ],
    gameWhy: "Start the ladder where the guide does, at six pieces and ten seconds, and climb only after three perfect rounds.",
    extraCtas: [
      {
        kind: "cta",
        target: { kind: "stat", tile: "span", label: "Check your memory span" },
        why: "Memory span is the largest piece count you rebuild accurately over several rounds, so it names the rung of the ladder you hold.",
      },
    ],
    articles: {
      "adriaan-de-groot": {
        label: "Adriaan de Groot's 1944 test of chess memory, by the numbers",
        why: "Read de Groot's 1944 memory test, the experiment behind rebuilding a position from a short look.",
      },
    },
  },
  "chess-pattern-recognition-drills": {
    group: "memory",
    description:
      "Four tactical shapes with their exact squares, a rebuild routine that makes each one stick, and what a random position can and cannot teach about patterns.",
    questions: [
      "How do I train pattern recognition in chess?",
      "Is pattern recognition the same as memorising puzzles?",
      "How many patterns should I learn at once?",
      "What does a knight fork look like on the board?",
    ],
    gameWhy: "A random twelve-piece board still has clusters, so look for pieces that guard each other before you place any.",
    articles: {
      "magnus-carlsen": {
        label: "How Magnus Carlsen names a famous game from one position",
        why: "Read how Carlsen names a game from one position, pattern recall at its far end.",
      },
    },
  },
  "how-to-think-in-chess-for-beginners": {
    group: "foundations",
    questions: [
      "What should I think about before each move?",
      "How do I stop moving too fast?",
      "When should I stop thinking and move?",
      "How should I use my clock in a 10-minute game?",
    ],
    gameWhy: "Twenty seconds on six pieces gives time to run the three questions before you place a single piece.",
  },
  "20-minute-daily-chess-study-plan": {
    group: "practice",
    questions: [
      "What is a good daily chess routine?",
      "How should I spend 20 minutes on chess?",
      "How do I study chess with little time?",
    ],
    gameWhy: "This is the first block of the twenty minutes. Three rounds at this setting and today's session has started.",
    extraCtas: [
      {
        kind: "cta",
        target: { kind: "stat", tile: "days", label: "Count your days played" },
        why: "The plan asks for five days a week, and days played is the figure that records whether the twenty minutes happened.",
      },
    ],
  },
  "how-to-analyze-chess-games-for-beginners": {
    group: "practice",
    questions: [
      "How do I analyse my chess games?",
      "Should beginners use the engine?",
      "How many games a week should I review?",
      "Should I review my wins?",
    ],
    gameWhy: "Rebuilding eight pieces from memory is the same skill as setting up the deciding position of a lost game.",
  },
  "how-many-chess-puzzles-a-day": {
    group: "practice",
    description:
      "Set the minutes first and the count follows. How long a checked puzzle takes, a count for each kind of session, and a recall check for a long block.",
    questions: [
      "How many chess puzzles should I do a day?",
      "Is one puzzle a day enough?",
      "Should I do puzzles before or after games?",
      "Are themed or mixed puzzles better?",
    ],
    gameWhy: "Run one round before the puzzles and one after; a lower score afterwards says the block went on too long.",
  },
};
