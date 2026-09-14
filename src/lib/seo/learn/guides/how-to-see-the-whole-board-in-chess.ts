import type { LearnGuide } from "../schema";

const guide: LearnGuide = {
  slug: "how-to-see-the-whole-board-in-chess",
  goal: "visualization",
  title: "How to See the Whole Board in Chess",
  h1: "How to see the whole chess board",
  description: "Use a simple board scan to notice distant pieces, spot threats, and avoid tunnel vision.",
  primaryKeyword: "how to see the whole board in chess",
  secondaryKeywords: [
    "chess board awareness",
    "stop tunnel vision in chess",
    "see the whole board chess",
    "chess scanning drills",
    "peripheral board vision chess",
  ],
  ctaLabel: "Train Whole-Board Vision",
  quickAnswer: "Before every move, check both kings, unprotected pieces, the centre, and the edges. Memory practice helps you keep more of the board in mind.",
  keyTakeaways: [
    "Tunnel vision means your attention is stuck in one area.",
    "Edge-piece checks are especially useful for beginners.",
    "A clear memory of the board makes scanning easier.",
  ],
  whoThisIsFor: [
    "Players who notice a tactic only on one side of the board.",
    "Beginners who keep missing bishops, rooks, or distant threats.",
    "Anyone who feels mentally cramped in open positions.",
  ],
  timeToRead: "7 min read",
  difficulty: "Beginner",
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
            "Many beginners look only at the pieces near their planned move. This makes distant bishops, rooks, and threats easy to miss.",
            "You do not need to stare at the board for longer. Use the same simple scan to check every important area.",
          ],
        },
      ],
    },
    {
      id: "start-here",
      title: "Start here: widen the scan",
      summary: "You can try these steps today.",
      blocks: [
        {
          kind: "steps",
          ordered: true,
          items: [
            "Check both kings and the lines pointing toward them.",
            "Look for unprotected pieces in the centre first, then on the edges.",
            "Sweep bishops and rooks across their full lines, not just the destination square you care about.",
            "Run a Memory Chess round so the whole board stays more available in attention.",
            "Before moving, ask what part of the board you have not looked at yet.",
          ],
        },
      ],
    },
    {
      id: "drills",
      title: "Drills to stop tunnel vision",
      summary: "A drill with a play link opens that exact round in Memory Chess. The rest you do away from the game.",
      blocks: [
        {
          kind: "drills",
          drills: [
            {
              title: "Edge-piece sweep",
              description: "Check corner and edge pieces before every move.",
              duration: "3 minutes",
              goal: "Catch threats outside the area you are focused on.",
              ctaLabel: "Sweep the edges",
            },
            {
              title: "Line-of-sight replay",
              description: "Trace each bishop and rook line completely instead of looking only at one target square.",
              duration: "4 minutes",
              goal: "Check more of the board during each scan.",
              ctaLabel: "Trace full lines",
            },
            {
              title: "Whole-board recall",
              description: "Play 10 pieces with 10 seconds to look. When the board clears, place the pieces zone by zone: queenside, centre, kingside.",
              duration: "5 minutes",
              goal: "Remember more of the board at one time.",
              ctaLabel: "Play 10 pieces, 10 seconds",
              setup: {
                pieceCount: 10,
                memorizeTime: 10,
              },
            },
          ],
        },
      ],
    },
    {
      id: "comparison",
      title: "Tunnel vision vs whole-board awareness",
      summary: "You do not need to look everywhere for the same amount of time. Make sure you do not miss anything important.",
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
              label: "Attention path",
              struggling: "You stare at one cluster of pieces.",
              stronger: "You touch the major risk zones in a consistent order.",
            },
            {
              label: "Long-range pieces",
              struggling: "You forget bishops and rooks away from the action.",
              stronger: "You scan their full lines before trusting a move.",
            },
            {
              label: "Board zones",
              struggling: "You skip the side of the board that feels quiet.",
              stronger: "You check the quiet side before moving.",
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
            "Thinking whole-board vision means looking longer instead of scanning better.",
            "Ignoring the edges because the center feels more urgent.",
            "Not tracing long-range piece lines completely.",
            "Trying to scan more of the board before you can remember the pieces clearly.",
          ],
        },
        {
          kind: "callout",
          title: "What to do instead",
          body: "Extra thinking time will not help without a clear scan. Check the board in the same order each time.",
        },
      ],
    },
    {
      id: "plan",
      title: "7-day whole-board scan plan",
      summary: "Follow these steps before making the practice harder or longer.",
      blocks: [
        {
          kind: "plan",
          steps: [
            {
              label: "Day 1 to 2",
              duration: "10 minutes",
              detail: "Use only king checks, loose-piece checks, and edge-piece sweeps.",
            },
            {
              label: "Day 3 to 4",
              duration: "12 minutes",
              detail: "Add full bishop and rook line tracing to the scan.",
            },
            {
              label: "Day 5",
              duration: "12 minutes",
              detail: "Use Memory Chess and recall the board by zones instead of random piece order.",
            },
            {
              label: "Day 6 to 7",
              duration: "15 minutes",
              detail: "Transfer the scan into rapid games and note which board zone caused the miss when a blunder happens.",
            },
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: "Why do I keep missing pieces on the other side of the board?",
      answer: "Because your attention is too local. A fixed scan order is better than hoping you naturally notice everything.",
    },
    {
      question: "Does Memory Chess help with whole-board awareness?",
      answer: "Yes. It trains you to keep more of the board active in memory instead of only the tactical hotspot.",
    },
    {
      question: "Should I look at the edges every move?",
      answer: "Yes, especially as a beginner. Many cheap blunders hide in edge pieces and long-range lines.",
    },
    {
      question: "How do I know the scan is improving?",
      answer: "You will miss fewer distant threats and feel less surprised by bishops, rooks, and discovered attacks.",
    },
  ],
  relatedArticles: [
    {
      slug: "chess-board-vision-drills",
      reason: "Pair whole-board awareness with a stronger safety checklist.",
    },
    {
      slug: "chess-visualization-exercises",
      reason: "Improve the mental board so wider scanning feels easier.",
    },
    {
      slug: "chess-coordinates-practice",
      reason: "Build faster square recognition so broad scans are less mentally expensive.",
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
