import type { LearnGuide } from "../schema";

const guide: LearnGuide = {
  slug: "how-to-analyze-chess-games-for-beginners",
  goal: "routine",
  title: "How to Analyze Chess Games for Beginners",
  h1: "How to analyze chess games for beginners",
  description: "Review your chess games, understand your mistakes, and choose one clear thing to practise next.",
  primaryKeyword: "how to analyze chess games for beginners",
  secondaryKeywords: [
    "beginner chess game review",
    "how to review chess games",
    "chess self analysis beginners",
    "analyze blunders in chess",
    "post game chess routine",
  ],
  ctaLabel: "Review Your Next Game",
  quickAnswer: "Find where the game changed, name the kind of mistake, and choose one thing to fix. Check the engine after you have looked at the position yourself.",
  keyTakeaways: [
    "End each review with one action, not a long list of engine moves.",
    "Naming the type of mistake helps you choose what to practise.",
    "Try to rebuild the key position from memory.",
  ],
  whoThisIsFor: [
    "Players who review games but do not know what to do next.",
    "Beginners who see the engine score change but do not know why.",
    "Anyone who wants a simpler post-game habit.",
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
            "Start with one question: what mistake changed the game? An engine score alone will not explain what you need to practise.",
            "Rebuild the key position, name the mistake, and use it to choose tomorrow’s drill.",
          ],
        },
      ],
    },
    {
      id: "start-here",
      title: "Start here: the beginner review loop",
      summary: "You can try these steps today.",
      blocks: [
        {
          kind: "steps",
          ordered: true,
          items: [
            "Find the first moment where the position changed sharply.",
            "Rebuild that position from memory before checking the engine.",
            "Label the mistake as vision, recall, calculation, or time-management.",
            "Ask what signal would have told you to slow down.",
            "Turn the answer into one drill for your next session.",
          ],
        },
      ],
    },
    {
      id: "drills",
      title: "Simple game review drills",
      summary: "A drill with a play link opens that exact round in Memory Chess. The rest you do away from the game.",
      blocks: [
        {
          kind: "drills",
          drills: [
            {
              title: "Rebuild the key position",
              description: "Recreate the key blunder position from memory before reviewing it.",
              duration: "5 minutes",
              goal: "Remember the position before checking the answer.",
              ctaLabel: "Rebuild a key moment",
            },
            {
              title: "Mistake-type tag",
              description: "Name each big error as vision, memory, calculation, or time trouble.",
              duration: "3 minutes",
              goal: "Know what to practise next.",
              ctaLabel: "Tag mistake type",
            },
            {
              title: "One-fix review",
              description: "Finish the review with one clear fix for tomorrow’s practice.",
              duration: "2 minutes",
              goal: "Finish with one useful next step.",
              ctaLabel: "Choose one fix",
            },
          ],
        },
      ],
    },
    {
      id: "comparison",
      title: "Helpful review vs unhelpful review",
      summary: "You do not need to study every move. Find the clearest lesson for your next practice.",
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
              label: "Engine use",
              struggling: "You jump to the engine immediately.",
              stronger: "You diagnose the mistake yourself before checking the engine.",
            },
            {
              label: "Output",
              struggling: "You end with many comments and no action.",
              stronger: "You end with one drill or checklist adjustment.",
            },
            {
              label: "Memory",
              struggling: "The position disappears as soon as the game ends.",
              stronger: "You rebuild the position and see the error more clearly.",
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
            "Reviewing only with engine lines and no self-diagnosis.",
            "Trying to analyze every move equally.",
            "Failing to name the type of mistake.",
            "Ending the review without choosing the next drill.",
          ],
        },
        {
          kind: "callout",
          title: "What to do instead",
          body: "Do not review every engine line. Name the mistake and practise the fix.",
        },
      ],
    },
    {
      id: "plan",
      title: "7-day game review habit",
      summary: "Follow these steps before making the practice harder or longer.",
      blocks: [
        {
          kind: "plan",
          steps: [
            {
              label: "Day 1 to 2",
              duration: "10 minutes",
              detail: "Review one game and identify only the first major turning point.",
            },
            {
              label: "Day 3 to 4",
              duration: "12 minutes",
              detail: "Rebuild that position from memory before checking the engine.",
            },
            {
              label: "Day 5",
              duration: "12 minutes",
              detail: "Label each major error by type and count which type appears most often.",
            },
            {
              label: "Day 6 to 7",
              duration: "15 minutes",
              detail: "Use the most common mistake type to choose the first drill in your next training session.",
            },
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: "Should beginners use the engine to analyze games?",
      answer: "Yes, but only after trying to diagnose the mistake yourself. Otherwise the review stays passive.",
    },
    {
      question: "How many mistakes should I review after a game?",
      answer: "One to three major turning points is enough for most beginners.",
    },
    {
      question: "What should I write down after analysis?",
      answer: "Write the mistake type, the missed signal, and one drill or checklist change for next time.",
    },
    {
      question: "How does Memory Chess help game analysis?",
      answer: "Practising board recall makes it easier to rebuild the key positions from your own games.",
    },
  ],
  relatedArticles: [
    {
      slug: "20-minute-daily-chess-study-plan",
      reason: "Fit game review into a routine that does not become overwhelming.",
    },
    {
      slug: "how-to-stop-blundering-in-chess",
      reason: "Turn review findings into anti-blunder drills.",
    },
    {
      slug: "chess-memory-training",
      reason: "Remember and rebuild key moments after the game.",
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
