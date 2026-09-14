import type { LearnGuide } from "../schema";

const guide: LearnGuide = {
  slug: "working-memory-exercises-for-chess",
  goal: "memory",
  title: "Working Memory Exercises for Chess Players",
  h1: "Working memory exercises for chess beginners",
  description: "Use simple chess exercises to remember move sequences, compare choices, and make clearer decisions.",
  primaryKeyword: "working memory exercises",
  secondaryKeywords: [
    "working memory for chess",
    "chess calculation training",
    "chess concentration drills",
    "improve chess consistency",
    "mental endurance chess",
  ],
  ctaLabel: "Start a Memory Routine",
  quickAnswer: "Working memory helps you hold a few possible move sequences in mind. Keep the number small and check each one clearly.",
  keyTakeaways: [
    "Three clear choices are better than six confusing ones.",
    "A short spoken summary can help you remember each line.",
    "Practise with real positions and use the skill in games.",
  ],
  whoThisIsFor: [
    "Players who forget the first line after exploring a second one.",
    "Beginners who mix up the order of moves.",
    "Anyone who makes more tactical mistakes when tired.",
  ],
  timeToRead: "8 min read",
  difficulty: "Beginner to Intermediate",
  publishedAt: "2026-03-06T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
  sections: [
    {
      id: "what-changes",
      title: "What improves first",
      eyebrow: "Recall and retention",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Working memory helps you keep possible moves in mind while you compare them. In chess, you need to remember the starting board and one or two short lines without mixing them up.",
            "Memory Chess helps you remember the starting board. When that picture is clear, following the next moves becomes easier.",
          ],
        },
      ],
    },
    {
      id: "start-here",
      title: "Start with two short move sequences",
      summary: "You can try these steps today.",
      blocks: [
        {
          kind: "steps",
          ordered: true,
          items: [
            "Pick one position and list three candidate moves without touching the board.",
            "Calculate each line for two plies and summarize the outcome in one sentence.",
            "Run a Memory Chess recall round to refresh the base position skill.",
            "Return to the position and compare the possible move sequences again.",
            "Write one sentence about where line tracking broke down.",
          ],
        },
      ],
    },
    {
      id: "drills",
      title: "Working memory drills for chess",
      summary: "A drill with a play link opens that exact round in Memory Chess. The rest you do away from the game.",
      blocks: [
        {
          kind: "drills",
          drills: [
            {
              title: "Three-line summary",
              description: "Hold three candidate moves briefly and describe each branch in one sentence.",
              duration: "6 minutes",
              goal: "Keep each move sequence clear instead of adding more.",
              ctaLabel: "Hold three lines",
            },
            {
              title: "Recall reset",
              description: "Between two line-calculation attempts, play one round of 8 pieces with 8 seconds to look, then go back to the lines.",
              duration: "4 minutes",
              goal: "Remember the starting position before following moves.",
              ctaLabel: "Play 8 pieces, 8 seconds",
              setup: {
                pieceCount: 8,
                memorizeTime: 8,
              },
            },
            {
              title: "Post-line comparison",
              description: "Return to the starting position and compare the branches after a short delay.",
              duration: "5 minutes",
              goal: "Move between the starting board and each possible line without mixing them up.",
              ctaLabel: "Compare Your Choices",
            },
          ],
        },
      ],
    },
    {
      id: "comparison",
      title: "When you try to remember too much",
      summary: "When your memory is full, the line becomes unclear and you mix up the move order.",
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
              label: "Candidate moves",
              struggling: "You try to hold too many options at once.",
              stronger: "You hold fewer lines, but each line stays accurate longer.",
            },
            {
              label: "Move order",
              struggling: "Branches bleed into each other.",
              stronger: "Each line stays separate and easy to compare.",
            },
            {
              label: "Fatigue",
              struggling: "Decision quality collapses late in the game.",
              stronger: "You keep a simpler, clearer process as energy drops.",
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
            "Trying to remember too many move sequences at once.",
            "Skipping a short spoken summary after each line.",
            "Practising only puzzles and never using the skill in games.",
            "Continuing after you are too tired to think clearly.",
          ],
        },
        {
          kind: "callout",
          title: "What to do instead",
          body: "Do not add more lines yet. Keep fewer lines clear before making them longer.",
        },
      ],
    },
    {
      id: "plan",
      title: "7-day working-memory block",
      summary: "Follow these steps before making the practice harder or longer.",
      blocks: [
        {
          kind: "plan",
          steps: [
            {
              label: "Day 1 to 2",
              duration: "10 minutes",
              detail: "Use only two move sequences and explain each one aloud.",
            },
            {
              label: "Day 3 to 4",
              duration: "12 minutes",
              detail: "Add a Memory Chess reset between attempts so the starting position remains clean.",
            },
            {
              label: "Day 5",
              duration: "12 minutes",
              detail: "Add a third choice only if the first two stay accurate.",
            },
            {
              label: "Day 6 to 7",
              duration: "15 minutes",
              detail: "Use the routine in one rapid game. Pause at hard moments and clearly name your possible moves.",
            },
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: "Do working memory exercises transfer to chess performance?",
      answer: "They can, especially when they are tied directly to positions, line tracking, and game review rather than generic brain games.",
    },
    {
      question: "How should beginners structure working memory practice?",
      answer: "Use short sessions that combine possible moves, board memory, and one real game position.",
    },
    {
      question: "What is a simple way to track improvement?",
      answer: "Track how many move sequences you can remember and how often you lose your place.",
    },
    {
      question: "Should this replace tactics training?",
      answer: "No. It should complement tactics by helping you keep the lines clearer while solving or playing.",
    },
  ],
  relatedArticles: [
    {
      slug: "chess-calculation-exercises-for-beginners",
      reason: "Use better working memory to compare possible moves.",
    },
    {
      slug: "chess-memory-training",
      reason: "Strengthen the recall layer underneath line tracking.",
    },
    {
      slug: "how-to-think-in-chess-for-beginners",
      reason: "Use a simpler thought process so working memory is not wasted.",
    },
  ],
  sources: [
    {
      title: "Templates in Chess Memory: A Mechanism for Recalling Several Boards",
      url: "https://doi.org/10.1006/cogp.1996.0011",
    },
    {
      title: "Test-Enhanced Learning: Taking Memory Tests Improves Retention",
      url: "https://doi.org/10.1111/j.1467-9280.2006.01693.x",
    },
  ],
};

export default guide;
