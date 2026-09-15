import type { LearnGuide } from "../schema";

const guide: LearnGuide = {
  slug: "how-to-get-better-at-chess-for-beginners",
  goal: "routine",
  title: "How to Get Better at Chess for Beginners",
  h1: "How to get better at chess for beginners",
  description:
    "A beginner chess plan for players who know the rules and still lose pieces for free. Read the whole board, ask one question before each move, play slower, write one line.",
  primaryKeyword: "how to get better at chess",
  secondaryKeywords: [
    "chess improvement plan",
    "beginner chess training",
    "chess routine for beginners",
    "reduce blunders in chess",
    "chess board vision",
  ],
  ctaLabel: "Play 4 pieces, 10 seconds",
  quickAnswer:
    "Use a short daily routine in a fixed order. Read the whole board before you think about your move, ask one safety question, play games slow enough to do both, and write one line after each game. Openings come last.",
  keyTakeaways: [
    "Stop leaving pieces where they can be taken for free before you study any opening.",
    "Read the whole board first, ask one question before every move, then play slowly enough to do both.",
    "One line after each game tells you which of those three failed.",
  ],
  whoThisIsFor: [
    "You know how the pieces move and lose most games to a piece left hanging.",
    "You have watched opening videos and cannot say why you still lose.",
    "You want a fixed order of things to work on, not a list of options.",
  ],
  timeToRead: "9 min read",
  difficulty: "Beginner",
  featured: true,
  publishedAt: "2026-03-06T00:00:00.000Z",
  updatedAt: "2026-09-15T00:00:00.000Z",
  sections: [
    {
      id: "where-games-go",
      title: "Where beginner games are actually lost",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "A lost piece outweighs whatever the opening gave you. When you lose one, look at where it stood and whether it could be taken for free.",
            "Here is one example. Your knight on f3 is pinned to your queen on d1 by a bishop on g4. Black pushes a pawn from e5 to e4, and the pawn attacks the knight.",
            "The knight can step away, but then the bishop takes the queen on d1. No opening book fixes that.",
            "Two habits do. Seeing every piece that is currently attacked, and checking your intended move against the reply before you play it.",
          ],
        },
        {
          kind: "callout",
          title: "The order this guide follows",
          body: "Board reading first, then the move question, then slower games, then a line after each game. Openings wait until the first three are automatic.",
        },
      ],
    },
    {
      id: "read-the-board",
      title: "Stage 1. Hold the whole board in your head",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Look only at the piece you are moving and the square it goes to, and the rest of the board becomes a blur. A Memory Chess round trains the opposite habit, because it gives you the whole position and nothing else.",
            "A round shows a position for a fixed number of seconds, then clears the board and asks you to rebuild it. The game counts a piece as correct only when its square, its type and its colour all match the original.",
            "Placing more pieces than the position had costs points. Put five pieces on a 4-piece round and ten points come off your accuracy, however many of the five are right.",
            "That makes the round a test of what you read, not of what you can guess. Testing yourself on material holds it better than studying it again.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Four pieces, read out loud",
              description:
                "Play 4 pieces with 10 seconds to look, 5 rounds. While the position is up, say each piece and its square out loud, like white knight c3. Then rebuild it.",
              duration: "about 4 minutes",
              goal: "Five rounds at 100 percent before you raise the piece count.",
              ctaLabel: "Play 4 pieces, 10 seconds",
              setup: {
                pieceCount: 4,
                memorizeTime: 10,
              },
            },
            {
              title: "Six pieces, same ten seconds",
              description:
                "Play 6 pieces with 10 seconds to look, 5 rounds. Keep naming every piece aloud, and start with the two kings so they are never the ones you miss.",
              duration: "about 5 minutes",
              goal: "Five rounds at 100 percent, then move on to eight.",
              ctaLabel: "Play 6 pieces, 10 seconds",
              setup: {
                pieceCount: 6,
                memorizeTime: 10,
              },
            },
            {
              title: "Eight pieces, where this stage stops",
              description:
                "Play 8 pieces with 10 seconds to look, 5 rounds. Naming every piece gets tight here, so name the pairs that attack or guard each other.",
              duration: "about 6 minutes",
              goal: "Most rounds at 100 percent. This is the ceiling this guide asks for.",
              ctaLabel: "Play 8 pieces, 10 seconds",
              setup: {
                pieceCount: 8,
                memorizeTime: 10,
              },
            },
          ],
        },
        {
          kind: "paragraphs",
          paragraphs: [
            "The three drills above are the whole progression. The count grows from 4 to 6 to 8 while the 10 seconds stay fixed.",
          ],
        },
      ],
    },
    {
      id: "move-question",
      title: "Stage 2. One question before every move",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "The question is always the same. After this move, what can the opponent take or attack for free? Ask it on every move, including the boring ones.",
            "To answer it, name the piece your opponent just moved and the new squares it now attacks. A bishop that arrives on c4 looks at f7. A queen that reaches h5 looks at f7 too, and at e5 and h7.",
            "Then look at your own move the same way. The piece you move stops guarding what it guarded. A knight on f3 guards e5, so moving it can leave a pawn on e5 loose.",
          ],
        },
        {
          kind: "steps",
          ordered: true,
          items: [
            "Say the opponent's last move and every new square it attacks.",
            "Pick your move, but do not play it yet.",
            "Ask what they can take or attack for free after it, including anything the moving piece used to guard.",
            "If the answer is anything at all, pick again.",
          ],
        },
        {
          kind: "callout",
          title: "Why the question works",
          body: "Avoiding a free capture needs no long calculation, only a look at the right piece. The question forces the look on every move.",
        },
      ],
    },
    {
      id: "slow-games",
      title: "Stage 3. Play slow enough to use the question",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "A 3-minute game that lasts 40 moves leaves you under 5 seconds a move. The question takes longer than that while it is new, so blitz trains you to skip it.",
            "Play 15 minutes with a 10-second increment, or longer. One game a day at that speed is enough for this stage.",
            "At 15+10 there is time to ask the question on every move. At 5+0 there is not. That gap is the whole reason this stage exists.",
          ],
        },
      ],
    },
    {
      id: "one-line",
      title: "Stage 4. One line after every game",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Skip the full engine review for now. Find the move where you lost a piece or missed a check, and write one line about it.",
            "The line names the stage that failed. Did not look at the board, did not ask the question, or asked it and rushed. Keep the lines in one place.",
            "After ten games, count which stage the lines name most often. That is what you practise next, and the guide on analysing games turns the line into a routine.",
          ],
        },
      ],
    },
    {
      id: "four-weeks",
      title: "Four weeks in the right order",
      blocks: [
        {
          kind: "plan",
          steps: [
            {
              label: "Week 1",
              duration: "4 minutes plus one slow game",
              detail:
                "Five rounds of 4 pieces, 10 seconds, each piece named out loud. Then one 15+10 game with the question asked before every move. One line afterwards.",
            },
            {
              label: "Week 2",
              duration: "5 minutes plus one slow game",
              detail:
                "Five rounds of 6 pieces, 10 seconds. Same game, same question. Read your week 1 lines before you play.",
            },
            {
              label: "Week 3",
              duration: "6 minutes plus one slow game",
              detail:
                "Five rounds of 8 pieces, 10 seconds. In the game, also name what your moving piece stops guarding before you move it.",
            },
            {
              label: "Week 4",
              duration: "6 minutes plus one slow game",
              detail:
                "Keep the 8-piece rounds. Count your lines by stage. Whichever stage appears most is your first job next month.",
            },
          ],
        },
      ],
    },
    {
      id: "openings-last",
      title: "When openings finally earn their place",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Openings matter once your pieces stop disappearing for free. Until then a memorised line takes you to move ten with a position you cannot hold in your head.",
            "When you get there, keep it small. For white, play e4 and bring the knights out before the bishops. For black, answer e4 with e5 and d4 with d5.",
            "Learn the reason for each move before you learn the next one. A move you can explain is one you can still find when your opponent leaves the book.",
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: "How long before this shows up in my rating?",
      answer:
        "Rating moves slowly and depends on who you are paired with, so it is a poor weekly signal. Count hanging pieces per game instead, from your stage 4 lines.",
    },
    {
      question: "Is Memory Chess enough on its own?",
      answer:
        "No. It trains reading the board, which is stage 1. Stages 2 to 4 happen in real games and nothing replaces them.",
    },
    {
      question: "Should I do puzzles too?",
      answer:
        "Yes, a few a day, solved slowly. The guide on how many puzzles a day explains how to set the count from the minutes you have.",
    },
    {
      question: "What piece count should I stop at?",
      answer:
        "Eight pieces at 10 seconds is enough for this guide. Higher counts are for players who want the memory skill for its own sake.",
    },
  ],
  relatedArticles: [
    {
      slug: "how-to-stop-blundering-in-chess",
      reason: "A longer checklist for stage 2 once the single question is automatic.",
    },
    {
      slug: "chess-memory-training",
      reason: "More memory rounds for players who want to push stage 1 past eight pieces.",
    },
    {
      slug: "20-minute-daily-chess-study-plan",
      reason: "The four stages packed into a fixed twenty minutes.",
    },
    {
      slug: "how-to-analyze-chess-games-for-beginners",
      reason: "What to do with the one line from stage 4.",
    },
    {
      slug: "how-many-chess-puzzles-a-day",
      reason: "How to size the puzzle habit that sits beside these stages.",
    },
  ],
  sources: [
    {
      title: "Test-Enhanced Learning: Taking Memory Tests Improves Long-Term Retention",
      url: "https://doi.org/10.1111/j.1467-9280.2006.01693.x",
      note: "Supports the claim in stage 1 that testing yourself on material holds it better than studying it again.",
    },
  ],
};

export default guide;
