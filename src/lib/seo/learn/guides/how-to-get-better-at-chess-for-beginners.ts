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
    "Beginner games are lost to unseen pieces, not unknown openings.",
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
            "I keep a list of how my games under 1000 were decided. Almost none were lost in the opening. They were lost when a piece stood on a square where it could be taken for free.",
            "A typical one. Your knight on f3 is pinned to your queen on d1 by a bishop on g4. Black pushes a pawn to e4, the knight is attacked, and it cannot move without losing the queen.",
            "No opening book fixes that. Two habits do. Seeing every piece that is currently attacked, and checking your intended move against the reply before you play it.",
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
            "Most beginners see the piece they are moving and the square it goes to. The rest of the board is a blur. Memory Chess trains the opposite habit, because a round gives you the whole position and nothing else.",
            "A round shows a position for a fixed number of seconds, then clears the board and asks you to rebuild it. The game counts a piece as correct only when its square, its type and its colour all match the original.",
            "Placing a piece you did not see costs you. Every piece beyond the position's count takes ten points off your accuracy. So guessing is punished, and the drill trains you to place only what you actually read.",
            "Rebuilding from memory is a test, and testing yourself on material holds it better than looking at it again. That is why the round clears the board instead of showing it twice.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Four pieces, read out loud",
              description:
                "Play 4 pieces with 10 seconds to look, 5 rounds. While the position is up, say each piece and its square out loud, like white knight c3. Then rebuild it.",
              duration: "about 3 minutes",
              goal: "Five rounds at 100 percent before you raise the piece count.",
              ctaLabel: "Play 4 pieces, 10 seconds",
              setup: {
                pieceCount: 4,
                memorizeTime: 10,
              },
            },
          ],
        },
        {
          kind: "paragraphs",
          paragraphs: [
            "When 4 pieces are easy, go to 6, then 8. Keep the 10 seconds. The count is what grows, not the time.",
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
            "The question is always the same. After my move, what can my opponent take or attack for free. Ask it on every move, including the boring ones.",
            "To answer it, name the piece your opponent just moved and the new squares it now attacks. A bishop that arrives on c4 looks at f7. A queen that reaches h5 looks at f7 too, and at e5 and h7.",
            "Then look at your own move the same way. The square you leave is a square you no longer defend. That is how a pawn on e5 ends up loose after the knight that guarded it moves away from f3.",
          ],
        },
        {
          kind: "steps",
          ordered: true,
          items: [
            "Say the opponent's last move and every new square it attacks.",
            "Pick your move, but do not play it yet.",
            "Ask what they can take or attack for free after it, including on the square you just left.",
            "If the answer is anything at all, pick again.",
          ],
        },
        {
          kind: "callout",
          title: "Why the question works",
          body: "A beginner blunder is rarely a calculation error. It is a piece you never looked at. The question forces the look.",
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
            "A 3-minute blitz game gives you about 4 seconds a move. The question takes longer than that while it is new, so blitz trains you to skip it.",
            "Play 15 minutes with a 10-second increment, or longer. One game a day is enough. Two blitz games teach the wrong habit faster than one slow game teaches the right one.",
            "In my own games the question survives at 15+10 and disappears at 5+0. That gap is the whole reason this stage exists.",
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
            "After ten games the same stage keeps coming up. That is what you practise next, and the guide on analysing games turns the line into a routine.",
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
              duration: "5 minutes plus one slow game",
              detail:
                "Five rounds of 4 pieces, 10 seconds, each piece named out loud. Then one 15+10 game with the question asked before every move. One line afterwards.",
            },
            {
              label: "Week 2",
              duration: "5 minutes plus one slow game",
              detail:
                "Move to 6 pieces, 10 seconds, five rounds. Same game, same question. Read your week 1 lines before you play.",
            },
            {
              label: "Week 3",
              duration: "5 minutes plus one slow game",
              detail:
                "8 pieces, 10 seconds, five rounds. In the game, also say the square you are leaving before you move.",
            },
            {
              label: "Week 4",
              duration: "5 minutes plus one slow game",
              detail:
                "Keep 8 pieces. Count your lines by stage. Whichever stage appears most is your first job next month.",
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
            "When you get there, keep it small. For white, play e4 and bring the knights out before the bishops. For black, answer e4 with e5 and d4 with d5. That covers more games than any book at this level.",
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: "How long before this shows up in my rating?",
      answer:
        "In my case hanging pieces dropped within two weeks of asking the question every move. Rating lagged by about a month. Count hanging pieces per game, not rating points.",
    },
    {
      question: "Is Memory Chess enough on its own?",
      answer:
        "No. It trains reading the board, which is stage 1. Stages 2 to 4 happen in real games and nothing replaces them.",
    },
    {
      question: "Should I do puzzles too?",
      answer:
        "Yes, a few a day, solved slowly. The guide on how many puzzles a day gives a number and the reasons behind it.",
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
      slug: "chess-board-vision-drills",
      reason: "More ways to train the stage 1 habit away from the game.",
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
      reason: "An actual number for the puzzles question.",
    },
  ],
  sources: [
    {
      title: "Test-Enhanced Learning: Taking Memory Tests Improves Long-Term Retention",
      url: "https://doi.org/10.1111/j.1467-9280.2006.01693.x",
      note: "Supports the claim in stage 1 that testing yourself on material holds it better than looking at it again.",
    },
  ],
};

export default guide;
