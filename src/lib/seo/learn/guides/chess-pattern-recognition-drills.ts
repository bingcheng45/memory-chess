import type { LearnGuide } from "../schema";

const guide: LearnGuide = {
  slug: "chess-pattern-recognition-drills",
  goal: "memory",
  title: "Chess Pattern Recognition Drills",
  h1: "Chess pattern recognition drills for beginners",
  description: "Use simple drills to recognise common chess patterns and spot useful ideas faster.",
  primaryKeyword: "chess pattern recognition drills",
  secondaryKeywords: [
    "pattern recognition chess",
    "chess motifs training",
    "tactical pattern drills",
    "beginner chess patterns",
    "memorize chess motifs",
  ],
  ctaLabel: "Train Chess Patterns",
  quickAnswer: "A chess pattern is a familiar group of pieces and squares. Repeat the same type of pattern until you can quickly see the idea behind it.",
  keyTakeaways: [
    "A pattern includes the board shape and the idea it creates.",
    "Board memory helps you spot patterns under time pressure.",
    "Repeat a few common patterns before adding many new ones.",
  ],
  whoThisIsFor: [
    "Players who solve tactics but fail to notice similar shapes in games.",
    "Beginners who want more structure than random puzzles.",
    "Anyone whose positions still feel visually chaotic.",
  ],
  timeToRead: "7 min read",
  difficulty: "Beginner",
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
            "Pattern recognition makes a position feel familiar. A board shape may suggest a fork, pin, trapped piece, or weak square before you calculate every move.",
            "Start with a small group of common patterns. Rebuild each position from memory so you remember the pieces and squares that make the idea work.",
          ],
        },
      ],
    },
    {
      id: "start-here",
      title: "Start with one pattern at a time",
      summary: "You can try these steps today.",
      blocks: [
        {
          kind: "steps",
          ordered: true,
          items: [
            "Choose one pattern type, such as forks, pins, or attacks on unprotected pieces.",
            "Study the shape and rebuild it from memory, not only from a static diagram.",
            "Name the squares and defenders that make the pattern work.",
            "Run one Memory Chess round to reinforce clean board recall.",
            "Review one recent game to find where a similar pattern appeared or was missed.",
          ],
        },
      ],
    },
    {
      id: "drills",
      title: "Simple pattern recognition drills",
      summary: "A drill with a play link opens that exact round in Memory Chess. The rest you do away from the game.",
      blocks: [
        {
          kind: "drills",
          drills: [
            {
              title: "Rebuild a pattern",
              description: "Recreate one chess pattern from memory and name the key pieces and squares.",
              duration: "5 minutes",
              goal: "Connect the pattern to a clear memory of the board.",
              ctaLabel: "Rebuild a Pattern",
            },
            {
              title: "Family repetition",
              description: "Repeat several examples of the same pattern before changing to a new type.",
              duration: "5 minutes",
              goal: "Make the board shape feel familiar.",
              ctaLabel: "Repeat one family",
            },
            {
              title: "Find it in a game",
              description: "Look through one recent game and find where the same pattern appeared.",
              duration: "5 minutes",
              goal: "Use pattern practice with real game positions.",
              ctaLabel: "Hunt in your own games",
            },
          ],
        },
      ],
    },
    {
      id: "comparison",
      title: "Random tactics vs real pattern recognition",
      summary: "Patterns are useful when you notice them before you start a long calculation.",
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
              label: "Training structure",
              struggling: "You keep changing between unrelated patterns.",
              stronger: "You repeat one pattern type until it feels familiar.",
            },
            {
              label: "Board recall",
              struggling: "You know the idea but not the exact squares that support it.",
              stronger: "You remember the structural details that make the pattern work.",
            },
            {
              label: "Real games",
              struggling: "Patterns stay trapped inside puzzles.",
              stronger: "You notice their early warning signs in live games.",
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
            "Learning only a pattern name without understanding the board shape.",
            "Changing pattern types too often.",
            "Ignoring the squares and defenders that make the pattern work.",
            "Skipping game review after pattern training.",
          ],
        },
        {
          kind: "callout",
          title: "What to do instead",
          body: "Do not add more variety too quickly. Repeat one pattern type until it is familiar.",
        },
      ],
    },
    {
      id: "plan",
      title: "7-day pattern recognition plan",
      summary: "Follow these steps before making the practice harder or longer.",
      blocks: [
        {
          kind: "plan",
          steps: [
            {
              label: "Day 1 to 2",
              duration: "10 minutes",
              detail: "Choose one pattern type and rebuild several examples from memory.",
            },
            {
              label: "Day 3 to 4",
              duration: "12 minutes",
              detail: "Add square naming and defender counting to each example.",
            },
            {
              label: "Day 5",
              duration: "12 minutes",
              detail: "Play a Memory Chess round before pattern practice so the board feels clearer.",
            },
            {
              label: "Day 6 to 7",
              duration: "15 minutes",
              detail: "Search your recent games for the same pattern and note where it appeared or almost appeared.",
            },
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: "What is pattern recognition in chess?",
      answer: "It means seeing a familiar board shape and quickly remembering the idea that often works there.",
    },
    {
      question: "How do beginners train pattern recognition?",
      answer: "Repeat a small set of patterns, rebuild the positions from memory, and look for them in real games.",
    },
    {
      question: "Are puzzles enough for pattern recognition?",
      answer: "Not always. Puzzles help, but repeating the same pattern type and reviewing games make it easier to use.",
    },
    {
      question: "Why mix Memory Chess with pattern drills?",
      answer: "Because pattern recognition is easier when the full board stays clearer in memory.",
    },
  ],
  relatedArticles: [
    {
      slug: "chess-memory-training",
      reason: "Build a stronger recall layer for pattern learning.",
    },
    {
      slug: "how-many-chess-puzzles-a-day",
      reason: "Balance pattern practice with a useful number of puzzles.",
    },
    {
      slug: "why-puzzle-rating-doesnt-transfer-to-games",
      reason: "Use the patterns you study in real games.",
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
