import type { LearnGuide } from "../schema";

const guide: LearnGuide = {
  slug: "chess-visualization-exercises",
  goal: "visualization",
  title: "Chess Visualization Exercises for Beginners",
  h1: "Chess visualization exercises beginners can do daily",
  description: "Try simple chess visualization exercises to remember the board and picture moves more clearly.",
  primaryKeyword: "chess visualization exercises",
  secondaryKeywords: [
    "chess visualization training",
    "calculate moves ahead",
    "board visualization chess",
    "blindfold preparation",
    "mental chess practice",
  ],
  ctaLabel: "Practise Visualization",
  quickAnswer: "First, remember a board without moving anything. Then picture one move at a time. You do not need to play a full game blindfolded.",
  keyTakeaways: [
    "Short daily practice works better than rare, long sessions.",
    "Check your imagined board after every try.",
    "Picture one move clearly before trying longer lines.",
  ],
  whoThisIsFor: [
    "Players who forget a line after one exchange.",
    "Beginners who struggle when they cannot look at the board.",
    "Anyone who wants to try blindfold chess step by step.",
  ],
  timeToRead: "8 min read",
  difficulty: "Beginner",
  featured: true,
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
            "Visualization means picturing how the board changes after a move. For beginners, the goal is simply to compare two possible moves without losing track of the pieces.",
            "Memory Chess shows which pieces or squares you forget. You can then practise the same kind of position again.",
          ],
        },
      ],
    },
    {
      id: "start-here",
      title: "Start with these visualization steps",
      summary: "You can try these steps today.",
      blocks: [
        {
          kind: "steps",
          ordered: true,
          items: [
            "Name every piece and square from a static board for 60 seconds.",
            "Close your eyes and rebuild the board in your mind before checking it.",
            "Imagine one legal move for each side without touching the pieces.",
            "Run one Memory Chess round with a moderate piece count and strict timer.",
            "Verify the position and repeat only after you know what you forgot.",
          ],
        },
      ],
    },
    {
      id: "drills",
      title: "Easy visualization drills",
      summary: "A drill with a play link opens that exact round in Memory Chess. The rest you do away from the game.",
      blocks: [
        {
          kind: "drills",
          drills: [
            {
              title: "Static board snapshot",
              description: "Look at 6 pieces for 10 seconds, then place each one back on its square.",
              duration: "4 minutes",
              goal: "Remember the board before you start picturing moves.",
              ctaLabel: "Play 6 pieces, 10 seconds",
              setup: {
                pieceCount: 6,
                memorizeTime: 10,
              },
            },
            {
              title: "One move each side",
              description: "Remember the board, picture one move for each side, then check your answer.",
              duration: "5 minutes",
              goal: "Learn to update the board in your head.",
              ctaLabel: "Train one-move updates",
            },
            {
              title: "Pressure-window recall",
              description: "Keep 6 pieces but cut the look time to 5 seconds. Do this only once your 10-second rounds are accurate.",
              duration: "5 minutes",
              goal: "Use clear recall in faster games.",
              ctaLabel: "Play 6 pieces, 5 seconds",
              setup: {
                pieceCount: 6,
                memorizeTime: 5,
              },
            },
          ],
        },
      ],
    },
    {
      id: "comparison",
      title: "What weak visualization feels like",
      summary: "It may feel like a calculation problem, but often the board picture is fading too quickly.",
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
              struggling: "You can name a move but not the resulting board clearly.",
              stronger: "You can compare two possible positions before moving.",
            },
            {
              label: "Tactical chaos",
              struggling: "Your head goes blank after exchanges.",
              stronger: "You hold the important squares and threats long enough to decide calmly.",
            },
            {
              label: "Training feedback",
              struggling: "You do not know exactly what square you forgot.",
              stronger: "You catch whether the error came from a file, rank, or missing defender.",
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
            "Trying deep blindfold calculation before static recall is stable.",
            "Moving pieces physically during every calculation attempt.",
            "Practicing once a week instead of repeating a short daily block.",
            "Not checking whether the imagined board matches reality.",
          ],
        },
        {
          kind: "callout",
          title: "What to do instead",
          body: "Do not chase longer lines yet. First, picture the first move clearly.",
        },
      ],
    },
    {
      id: "plan",
      title: "7-day visualization progression",
      summary: "Follow these steps before making the practice harder or longer.",
      blocks: [
        {
          kind: "plan",
          steps: [
            {
              label: "Day 1",
              duration: "10 minutes",
              detail: "Use only static board snapshots and immediate verification.",
            },
            {
              label: "Day 2 to 3",
              duration: "12 minutes",
              detail: "Add one imagined move per side and track which squares disappear first.",
            },
            {
              label: "Day 4 to 5",
              duration: "15 minutes",
              detail: "Lower the viewing window on Memory Chess while keeping piece count stable.",
            },
            {
              label: "Day 6 to 7",
              duration: "15 minutes",
              detail: "Transfer the drill into one rapid game by pausing before each tactical decision and naming the resulting board.",
            },
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: "How long until chess visualization improves?",
      answer: "Most beginners notice cleaner board recall within two to four weeks of short, consistent practice.",
    },
    {
      question: "Do visualization drills help blitz games?",
      answer: "Yes. Faster mental board updates make checks, captures, and threats easier to spot under time pressure.",
    },
    {
      question: "Can I train visualization without blindfold chess?",
      answer: "Yes. Timed recall and one-move update drills are enough to build a real beginner foundation.",
    },
    {
      question: "What should I do if I keep forgetting piece locations?",
      answer: "Use fewer pieces, check more often, and repeat the position until your recall is clear.",
    },
  ],
  relatedArticles: [
    {
      slug: "blindfold-chess-training-for-beginners",
      reason: "Use this after static and one-move recall feel stable.",
    },
    {
      slug: "how-to-see-the-whole-board-in-chess",
      reason: "Train wider board awareness if you miss pieces at the edges.",
    },
    {
      slug: "chess-board-vision-drills",
      reason: "Use visualization with a simple threat check.",
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
    {
      title: "The Importance of Visualization in Chess",
      url: "https://www.chess.com/blog/OnlineChessTeacher/the-importance-of-visualization-in-chess",
      note: "Useful as a mainstream comparison point showing the topic is active but often under-structured for beginners.",
    },
  ],
};

export default guide;
