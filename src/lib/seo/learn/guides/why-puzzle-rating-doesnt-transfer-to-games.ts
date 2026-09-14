import type { LearnGuide } from "../schema";

const guide: LearnGuide = {
  slug: "why-puzzle-rating-doesnt-transfer-to-games",
  goal: "reduce-blunders",
  title: "Why Puzzle Rating Doesn't Transfer to Games",
  h1: "Why your puzzle rating doesn't transfer to games",
  description: "Learn why puzzle skill can feel different from real games and how board vision, memory, and review can close the gap.",
  primaryKeyword: "why puzzle rating doesn't transfer to games",
  secondaryKeywords: [
    "puzzle rating vs chess rating",
    "tactics not transferring to games",
    "chess puzzle skill in real games",
    "why am i better at puzzles than games",
    "board vision in chess",
  ],
  ctaLabel: "Practise for Real Games",
  quickAnswer: "A puzzle tells you that a tactic is there. A real game does not. You must notice the danger, remember the board, and know when to slow down.",
  keyTakeaways: [
    "A puzzle tells you there is a problem to solve.",
    "A game makes you find the dangerous moment yourself.",
    "Better board vision and memory help you notice tactics sooner.",
  ],
  whoThisIsFor: [
    "Players with a surprisingly high puzzle rating but flat game rating.",
    "Beginners who see tactics after the game, not during it.",
    "Anyone who cannot use puzzle ideas in real games.",
  ],
  timeToRead: "8 min read",
  difficulty: "Beginner",
  publishedAt: "2026-03-06T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
  sections: [
    {
      id: "what-changes",
      title: "What improves first",
      eyebrow: "Threat checks",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "This is a common beginner problem. You solve puzzles, but real games still include lost pieces, missed threats, and rushed moves.",
            "Doing more puzzles may not fix it. You also need to notice when a position becomes dangerous and picture what happens after each choice.",
          ],
        },
      ],
    },
    {
      id: "start-here",
      title: "Start by connecting puzzles to games",
      summary: "You can try these steps today.",
      blocks: [
        {
          kind: "steps",
          ordered: true,
          items: [
            "Before solving puzzles, spend 2 minutes scanning a board for checks, captures, and threats.",
            "Add one Memory Chess round so the board image stays stable under pressure.",
            "After a puzzle, ask what signal would have told you to slow down in a real game.",
            "Review one recent game blunder and compare it with a similar tactical puzzle.",
            "Use at least one rapid game each session to test whether the pre-move scan survives.",
          ],
        },
      ],
    },
    {
      id: "drills",
      title: "Drills that connect puzzles to games",
      summary: "A drill with a play link opens that exact round in Memory Chess. The rest you do away from the game.",
      blocks: [
        {
          kind: "drills",
          drills: [
            {
              title: "Find the warning sign",
              description: "Look for the warning sign before trying to find the tactic.",
              duration: "4 minutes",
              goal: "Notice dangerous positions earlier.",
              ctaLabel: "Train the signal first",
            },
            {
              title: "Recall before calculation",
              description: "Before your puzzle block, play one round of 6 pieces with 8 seconds to look.",
              duration: "4 minutes",
              goal: "Connect pattern practice to real play.",
              ctaLabel: "Play 6 pieces, 8 seconds",
              setup: {
                pieceCount: 6,
                memorizeTime: 8,
              },
            },
            {
              title: "Game-position replay",
              description: "Replay a missed tactical moment from your own game and solve it as if it were a puzzle.",
              duration: "6 minutes",
              goal: "Make tactical training feel like real positions again.",
              ctaLabel: "Replay your missed tactic",
            },
          ],
        },
      ],
    },
    {
      id: "comparison",
      title: "Puzzles vs games: what changes?",
      summary: "The tactical move may be identical, but the mental task is not.",
      blocks: [
        {
          kind: "comparison",
          columns: [
            "Situation",
            "Before practice",
            "After practice",
          ],
          rows: [
            {
              label: "Problem framing",
              struggling: "The game does not tell you a tactic exists.",
              stronger: "You notice the signal that tension just changed.",
            },
            {
              label: "Board clarity",
              struggling: "The line blurs once multiple pieces move.",
              stronger: "You keep the important squares and defenders active in memory.",
            },
            {
              label: "Decision timing",
              struggling: "You move at normal speed when the position becomes dangerous.",
              stronger: "You slow down when checks, captures, or threats appear.",
            },
          ],
        },
      ],
    },
    {
      id: "mistakes",
      title: "Common mistakes to avoid",
      blocks: [
        {
          kind: "steps",
          ordered: false,
          items: [
            "Doing puzzles without any transfer step into games.",
            "Assuming tactical knowledge alone should prevent blunders.",
            "Never reviewing why a game position became dangerous.",
            "Treating board vision as separate from tactics.",
          ],
        },
        {
          kind: "callout",
          title: "What to do instead",
          body: "Do not only add more puzzles. Practise noticing tactical moments in your own games too.",
        },
      ],
    },
    {
      id: "plan",
      title: "7-day puzzle-transfer block",
      summary: "Follow these steps before making the practice harder or longer.",
      blocks: [
        {
          kind: "plan",
          steps: [
            {
              label: "Day 1 to 2",
              duration: "12 minutes",
              detail: "Add signal-before-solution thinking to every puzzle session.",
            },
            {
              label: "Day 3 to 4",
              duration: "12 minutes",
              detail: "Use a short Memory Chess round before puzzles or rapid play.",
            },
            {
              label: "Day 5",
              duration: "15 minutes",
              detail: "Replay three missed tactical moments from your own games.",
            },
            {
              label: "Day 6 to 7",
              duration: "15 to 20 minutes",
              detail: "Play rapid and stop yourself whenever the position becomes forcing or tactically tense.",
            },
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: "Why am I better at puzzles than games?",
      answer: "Because a puzzle already tells you that there is a tactic to find. A real game does not.",
    },
    {
      question: "Should I stop doing puzzles?",
      answer: "No. Keep them, but add board vision, recall, and game-position replay so the patterns transfer.",
    },
    {
      question: "What is the best transfer drill?",
      answer: "Replay a missed tactic from your own game and solve it after rebuilding the position from memory.",
    },
    {
      question: "How do I measure transfer?",
      answer: "Track whether blunders per game and missed simple tactics decline, not just whether puzzle rating rises.",
    },
  ],
  relatedArticles: [
    {
      slug: "how-to-stop-blundering-in-chess",
      reason: "Use this to build a shorter anti-blunder checklist for real games.",
    },
    {
      slug: "chess-board-vision-drills",
      reason: "Strengthen the scanning habit that makes tactics visible.",
    },
    {
      slug: "how-many-chess-puzzles-a-day",
      reason: "Choose a puzzle amount that leaves time for games.",
    },
  ],
  sources: [
    {
      title: "Recognition and Look-Ahead Search in Time-Constrained Expert Chess",
      url: "https://doi.org/10.1111/j.1467-9280.1996.tb00666.x",
    },
    {
      title: "Templates in Chess Memory: A Mechanism for Recalling Several Boards",
      url: "https://doi.org/10.1006/cogp.1996.0011",
    },
    {
      title: "Puzzle rating vs regular chess rating (r/chess)",
      url: "https://www.reddit.com/r/chess/comments/mmc874/what_do_you_care_more_about_puzzle_rating_or/",
      note: "A discussion about why puzzle scores and game results can feel very different.",
    },
  ],
};

export default guide;
