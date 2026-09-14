import type { LearnGuide } from "../schema";

const guide: LearnGuide = {
  slug: "how-to-think-in-chess-for-beginners",
  goal: "routine",
  title: "How to Think in Chess for Beginners",
  h1: "How to think in chess for beginners",
  description: "Use a simple move routine to check threats, compare choices, and manage your time without overthinking.",
  primaryKeyword: "how to think in chess",
  secondaryKeywords: [
    "beginner chess thought process",
    "what to think about in chess",
    "chess decision making beginners",
    "chess move checklist",
    "simple chess thinking routine",
  ],
  ctaLabel: "Practise a Simple Move Routine",
  quickAnswer: "Use the same short routine each move: check your opponent’s threats, choose one to three moves, and make sure your final choice is safe.",
  keyTakeaways: [
    "A short routine is easier to use than a long checklist.",
    "Threat checks should always come before move selection.",
    "Spend more time when the position becomes dangerous.",
  ],
  whoThisIsFor: [
    "Players who guess in calm positions and freeze in sharp ones.",
    "Beginners who need a clear routine for every move.",
    "Anyone who wants cleaner decisions under time pressure.",
  ],
  timeToRead: "7 min read",
  difficulty: "Beginner",
  publishedAt: "2026-03-06T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
  sections: [
    {
      id: "what-changes",
      title: "What improves first",
      eyebrow: "Consistency",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Beginners often wonder what stronger players think about. The answer can sound complicated, but your move routine should be short enough to use every time.",
            "Start with threats, choose a small number of possible moves, and check that your final choice is safe.",
          ],
        },
      ],
    },
    {
      id: "start-here",
      title: "Start here: the four-step move routine",
      summary: "You can try these steps today.",
      blocks: [
        {
          kind: "steps",
          ordered: true,
          items: [
            "Check the opponent’s strongest threats first.",
            "List one to three realistic candidate moves.",
            "Check that your planned move is safe and does not leave a piece unprotected.",
            "Ask whether the position is calm enough to move or sharp enough to slow down.",
            "After the game, review where the routine broke down.",
          ],
        },
      ],
    },
    {
      id: "drills",
      title: "Drills for calmer decisions",
      summary: "A drill with a play link opens that exact round in Memory Chess. The rest you do away from the game.",
      blocks: [
        {
          kind: "drills",
          drills: [
            {
              title: "Opponent-first trigger",
              description: "Start every training position by naming the opponent’s immediate forcing options.",
              duration: "3 minutes",
              goal: "Make threat checks automatic instead of optional.",
              ctaLabel: "Start with threats",
            },
            {
              title: "Three-candidate cap",
              description: "Never allow yourself more than three candidate moves in one training position.",
              duration: "4 minutes",
              goal: "Reduce overthinking and too many choices.",
              ctaLabel: "Cap the candidates",
            },
            {
              title: "Confidence check replay",
              description: "Review a move and ask whether you were actually certain or simply tired of thinking.",
              duration: "4 minutes",
              goal: "Notice when you move only because you are tired of thinking.",
              ctaLabel: "Review confidence",
            },
          ],
        },
      ],
    },
    {
      id: "comparison",
      title: "A simple move routine",
      summary: "The best thought process is the one you can still use when the clock is running.",
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
              label: "Threat handling",
              struggling: "You think about your plan first.",
              stronger: "You start with the opponent’s strongest threats.",
            },
            {
              label: "Candidate moves",
              struggling: "You bounce across too many possibilities.",
              stronger: "You keep a small, realistic candidate set.",
            },
            {
              label: "Time usage",
              struggling: "You spend the same kind of attention on every move.",
              stronger: "You slow down when tension, tactics, or king safety changes.",
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
            "Using a long checklist that you never follow in real games.",
            "Thinking about your own plan before checking threats.",
            "Letting the candidate list grow too large.",
            "Confusing fatigue with confidence.",
          ],
        },
        {
          kind: "callout",
          title: "What to do instead",
          body: "Do not add more checks to the list. Use a short routine you can repeat on every move.",
        },
      ],
    },
    {
      id: "plan",
      title: "7-day thought-process tune-up",
      summary: "Follow these steps before making the practice harder or longer.",
      blocks: [
        {
          kind: "plan",
          steps: [
            {
              label: "Day 1 to 2",
              duration: "10 minutes",
              detail: "Use only the opponent-first trigger and three-candidate cap.",
            },
            {
              label: "Day 3 to 4",
              duration: "12 minutes",
              detail: "Add one short Memory Chess round so the board is clearer during decisions.",
            },
            {
              label: "Day 5",
              duration: "12 minutes",
              detail: "Review whether your last blunder came from threat-check failure or candidate confusion.",
            },
            {
              label: "Day 6 to 7",
              duration: "15 minutes",
              detail: "Use the full four-step routine in rapid play and note which step breaks under time pressure.",
            },
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: "What should beginners think about in chess?",
      answer: "Start with your opponent’s threats, choose one to three possible moves, and check that your final choice is safe.",
    },
    {
      question: "How many candidate moves should I consider?",
      answer: "Usually one to three. More than that often overwhelms beginners and reduces decision quality.",
    },
    {
      question: "Why do I freeze even when I know the routine?",
      answer: "Often because the board is not clear enough or the candidate set is too large. Simpler positions and recall work help.",
    },
    {
      question: "Can a thought process stop blunders?",
      answer: "Yes, especially when it forces threat checks before move selection.",
    },
  ],
  relatedArticles: [
    {
      slug: "how-to-stop-blundering-in-chess",
      reason: "Use a more explicit anti-blunder checklist when the thought process still leaks material.",
    },
    {
      slug: "chess-calculation-exercises-for-beginners",
      reason: "Use clearer calculation to compare possible moves.",
    },
    {
      slug: "chess-coordinates-practice",
      reason: "Recognise squares faster during your move routine.",
    },
  ],
  sources: [
    {
      title: "Distributed Practice in Verbal Recall Tasks",
      url: "https://doi.org/10.1037/0033-2909.132.3.354",
    },
    {
      title: "Test-Enhanced Learning: Taking Memory Tests Improves Retention",
      url: "https://doi.org/10.1111/j.1467-9280.2006.01693.x",
    },
  ],
};

export default guide;
