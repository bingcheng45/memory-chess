import type { LearnGuide } from "../schema";

const guide: LearnGuide = {
  slug: "chess-calculation-exercises-for-beginners",
  goal: "visualization",
  title: "Chess Calculation Exercises for Beginners",
  h1: "Chess calculation exercises for beginners",
  description: "Use simple chess calculation exercises to compare moves and follow short lines without getting lost.",
  primaryKeyword: "chess calculation exercises",
  secondaryKeywords: [
    "beginner chess calculation",
    "calculate moves ahead chess",
    "line tracking chess drills",
    "candidate move practice",
    "chess visualization and calculation",
  ],
  ctaLabel: "Practise Clear Calculation",
  quickAnswer: "Compare only one or two possible moves at first. Keep the board clear in your mind and check the answer straight away.",
  keyTakeaways: [
    "Two clear move sequences are better than five confusing ones.",
    "Clear visualization leads to clearer calculation.",
    "Check your answer right after each exercise.",
  ],
  whoThisIsFor: [
    "Players who know they should calculate but lose the line quickly.",
    "Beginners who move on instinct in sharp positions.",
    "Anyone who wants to use memory practice in real decisions.",
  ],
  timeToRead: "7 min read",
  difficulty: "Beginner to Intermediate",
  publishedAt: "2026-03-06T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
  sections: [
    {
      id: "what-changes",
      title: "What improves first",
      eyebrow: "Mental board control",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Calculation simply means asking, “If I move here, what happens next?” The hard part is keeping the board clear while you follow the moves.",
            "Board memory and visualization make calculation easier. Practise those skills together instead of treating them as separate tasks.",
          ],
        },
      ],
    },
    {
      id: "start-here",
      title: "Start with two possible moves",
      summary: "You can try these steps today.",
      blocks: [
        {
          kind: "steps",
          ordered: true,
          items: [
            "Choose no more than two candidate moves from one position.",
            "Imagine one line for two plies and summarize it in one sentence.",
            "Use one Memory Chess round to keep the base board sharp.",
            "Return to the original position and compare the two lines calmly.",
            "Verify immediately and label whether the error was in the board image or the move sequence.",
          ],
        },
      ],
    },
    {
      id: "drills",
      title: "Simple calculation drills",
      summary: "A drill with a play link opens that exact round in Memory Chess. The rest you do away from the game.",
      blocks: [
        {
          kind: "drills",
          drills: [
            {
              title: "Two-candidate comparison",
              description: "Hold two reasonable moves and compare their short tactical futures.",
              duration: "6 minutes",
              goal: "Compare moves without trying to remember too much.",
              ctaLabel: "Compare two lines",
            },
            {
              title: "Recall then calculate",
              description: "Before your line work, play one round of 12 pieces with 8 seconds to look.",
              duration: "4 minutes",
              goal: "Remember the board before following a move sequence.",
              ctaLabel: "Play 12 pieces, 8 seconds",
              setup: {
                pieceCount: 12,
                memorizeTime: 8,
              },
            },
            {
              title: "Sentence summary line",
              description: "Summarize the branch in one sentence before checking it.",
              duration: "4 minutes",
              goal: "Keep the move sequence clear and easy to explain.",
              ctaLabel: "Summarize the branch",
            },
          ],
        },
      ],
    },
    {
      id: "comparison",
      title: "Messy calculation vs cleaner calculation",
      summary: "Do not chase longer lines yet. Make short lines accurate first.",
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
              struggling: "You consider too many moves at once.",
              stronger: "You compare a small number of sensible moves.",
            },
            {
              label: "Board image",
              struggling: "The resulting position gets blurry fast.",
              stronger: "You keep key squares and defenders stable in memory.",
            },
            {
              label: "Verification",
              struggling: "You do not know why the line failed.",
              stronger: "You can tell whether the error came from memory, move order, or judging the position.",
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
            "Trying to calculate too many branches at once.",
            "Skipping candidate-move selection and calculating everything.",
            "Not verifying immediately after the line.",
            "Ignoring weak board memory.",
          ],
        },
        {
          kind: "callout",
          title: "What to do instead",
          body: "Do not calculate many moves ahead yet. A clear two-move line is more useful than a confusing long one.",
        },
      ],
    },
    {
      id: "plan",
      title: "7-day beginner calculation plan",
      summary: "Follow these steps before making the practice harder or longer.",
      blocks: [
        {
          kind: "plan",
          steps: [
            {
              label: "Day 1 to 2",
              duration: "10 minutes",
              detail: "Use only two-candidate comparisons with immediate verification.",
            },
            {
              label: "Day 3 to 4",
              duration: "12 minutes",
              detail: "Add one Memory Chess round before calculation work.",
            },
            {
              label: "Day 5",
              duration: "12 minutes",
              detail: "Summarize each branch in one sentence before checking it.",
            },
            {
              label: "Day 6 to 7",
              duration: "15 minutes",
              detail: "Transfer the process into rapid games by pausing at tactically sharp moments and keeping the candidate set small.",
            },
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: "How can beginners improve calculation in chess?",
      answer: "Keep the candidate set small, verify quickly, and improve visualization and recall underneath the line work.",
    },
    {
      question: "Should I calculate more moves ahead?",
      answer: "Only after the current depth is reliable. Accuracy beats ambition.",
    },
    {
      question: "Why do my calculation lines collapse?",
      answer: "Often because the board image is not stable enough or because too many candidates are active at once.",
    },
    {
      question: "Does Memory Chess help calculation?",
      answer: "Yes. Stronger board recall makes it much easier to hold resulting positions during line calculation.",
    },
  ],
  relatedArticles: [
    {
      slug: "working-memory-exercises-for-chess",
      reason: "Improve the line-holding layer behind calculation.",
    },
    {
      slug: "chess-visualization-exercises",
      reason: "Picture the board more clearly before following longer lines.",
    },
    {
      slug: "how-to-think-in-chess-for-beginners",
      reason: "Use a simpler in-game decision process to support cleaner calculation.",
    },
  ],
  sources: [
    {
      title: "Templates in Chess Memory: A Mechanism for Recalling Several Boards",
      url: "https://doi.org/10.1006/cogp.1996.0011",
    },
    {
      title: "Recognition and Look-Ahead Search in Time-Constrained Expert Chess",
      url: "https://doi.org/10.1111/j.1467-9280.1996.tb00666.x",
    },
  ],
};

export default guide;
