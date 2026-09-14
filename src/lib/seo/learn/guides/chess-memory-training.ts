import type { LearnGuide } from "../schema";

const guide: LearnGuide = {
  slug: "chess-memory-training",
  goal: "memory",
  title: "Chess Memory Training Drills for Faster Recall",
  h1: "Chess memory training for beginner improvement",
  description: "Use simple chess memory drills to remember positions, notice patterns, and follow moves more clearly.",
  primaryKeyword: "chess memory training",
  secondaryKeywords: [
    "chess memory drills",
    "memorize chess positions",
    "pattern recognition chess",
    "board recall training",
    "chess concentration",
  ],
  ctaLabel: "Start a Memory Challenge",
  quickAnswer: "Chess memory training helps you remember useful positions while the pieces change. It is not about memorising as many random boards as possible.",
  keyTakeaways: [
    "Accuracy matters more than speed at first.",
    "Repeating the same settings helps you find one memory mistake at a time.",
    "Use memory practice before calculation or game review.",
  ],
  whoThisIsFor: [
    "Players who forget their plan after one strong reply.",
    "Beginners who cannot rebuild key positions from recent games.",
    "Anyone who struggles when many pieces are active.",
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
      eyebrow: "Recall and retention",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Chess memory is a practical skill. The goal is to hold a clear picture of the board long enough to choose a move calmly.",
            "Memory Chess gives you a simple loop: look, remember, check, and try again.",
          ],
        },
      ],
    },
    {
      id: "start-here",
      title: "Start with this memory routine",
      summary: "You can try these steps today.",
      blocks: [
        {
          kind: "steps",
          ordered: true,
          items: [
            "Begin with a simple position and memorise it for 10 seconds.",
            "Recreate the board and note the first square or piece you lost.",
            "Play a second round at the same settings and check whether the same mistake repeats.",
            "Add one short tactical line from the memorized setup.",
            "Track both accuracy and the type of memory error you made.",
          ],
        },
      ],
    },
    {
      id: "drills",
      title: "Memory drills for real games",
      summary: "A drill with a play link opens that exact round in Memory Chess. The rest you do away from the game.",
      blocks: [
        {
          kind: "drills",
          drills: [
            {
              title: "Same-settings repeat",
              description: "Play 6 pieces with 10 seconds to look, then play again at the same settings. Compare the two result screens.",
              duration: "5 minutes",
              goal: "Find one clear memory mistake you can fix.",
              ctaLabel: "Play 6 pieces, 10 seconds",
              setup: {
                pieceCount: 6,
                memorizeTime: 10,
              },
            },
            {
              title: "Pattern anchor recall",
              description: "Play 12 pieces with 10 seconds to look. Find both kings first, then the loose pieces, then fill in the rest.",
              duration: "4 minutes",
              goal: "Remember the most important parts of the position first.",
              ctaLabel: "Play 12 pieces, 10 seconds",
              setup: {
                pieceCount: 12,
                memorizeTime: 10,
              },
            },
            {
              title: "Recall-then-calculate",
              description: "Play 8 pieces with 10 seconds to look. After you rebuild the board, work out one short line from it before you press submit.",
              duration: "6 minutes",
              goal: "Use your board memory while calculating moves.",
              ctaLabel: "Play 8 pieces, 10 seconds",
              setup: {
                pieceCount: 8,
                memorizeTime: 10,
              },
            },
          ],
        },
      ],
    },
    {
      id: "comparison",
      title: "What weak recall looks like in games",
      summary: "The board can feel familiar while still being too blurry to support calculation.",
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
              label: "Line tracking",
              struggling: "You lose the original position while considering a new candidate move.",
              stronger: "You can return to the base position accurately after exploring a line.",
            },
            {
              label: "Pattern memory",
              struggling: "You remember a tactic idea but not the exact defenders.",
              stronger: "You remember both the tactical idea and the squares that make it work.",
            },
            {
              label: "Review quality",
              struggling: "Your game review feels vague because the position is gone immediately.",
              stronger: "You can rebuild key moments and learn from them faster.",
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
            "Using random difficulty jumps that are too large for your current level.",
            "Measuring speed while ignoring accuracy.",
            "Skipping error logs so repeated weaknesses stay hidden.",
            "Treating memory drills as separate from tactical play.",
          ],
        },
        {
          kind: "callout",
          title: "What to do instead",
          body: "Do not make the position harder while your recall is still unclear. Lower the difficulty and build accuracy first.",
        },
      ],
    },
    {
      id: "plan",
      title: "7-day memory training block",
      summary: "Follow these steps before making the practice harder or longer.",
      blocks: [
        {
          kind: "plan",
          steps: [
            {
              label: "Day 1 to 2",
              duration: "10 minutes",
              detail: "Repeat simple positions and name each memory error.",
            },
            {
              label: "Day 3 to 4",
              duration: "12 minutes",
              detail: "Add pattern anchors so you remember kings, loose pieces, and central tension first.",
            },
            {
              label: "Day 5",
              duration: "12 minutes",
              detail: "Add one short move sequence after each accurate board rebuild.",
            },
            {
              label: "Day 6 to 7",
              duration: "15 minutes",
              detail: "Shorten the timer slightly while keeping the piece count stable, then transfer the work into one rapid game review.",
            },
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: "Does chess memory training improve real games?",
      answer: "Yes, when it is paired with calculation or review. Better recall keeps tactical lines clearer under pressure.",
    },
    {
      question: "How many positions should I train per session?",
      answer: "For beginners, six to twelve careful attempts are enough if you verify errors instead of rushing.",
    },
    {
      question: "Should I train random boards or real-game patterns?",
      answer: "Use both. Random boards sharpen raw recall, while real structures improve transfer.",
    },
    {
      question: "What if accuracy stalls?",
      answer: "Use fewer pieces for a week, fix one type of error, and add more pieces only when recall is clear again.",
    },
  ],
  relatedArticles: [
    {
      slug: "working-memory-exercises-for-chess",
      reason: "Use this if you struggle to remember possible move sequences.",
    },
    {
      slug: "how-many-chess-puzzles-a-day",
      reason: "Balance memory practice with a useful number of puzzles.",
    },
    {
      slug: "chess-pattern-recognition-drills",
      reason: "Connect board memory to common chess patterns.",
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
