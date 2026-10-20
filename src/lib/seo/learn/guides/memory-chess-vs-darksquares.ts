import type { LearnDocument } from "../schema";

const guide: LearnDocument = {
  meta: {
    slug: "memory-chess-vs-darksquares",
    title: "Memory Chess vs DarkSquares Compared",
    h1: "Memory Chess vs DarkSquares",
    description: "DarkSquares is a seven-level blindfold chess course. Memory Chess trains position memory only. A feature table from both sites, and where each is ahead.",
    group: "compare",
    level: "improver",
    publishedAt: "2026-10-20T00:00:00.000Z",
    updatedAt: "2026-10-20T00:00:00.000Z",
    questions: [
      "What is the difference between Memory Chess and DarkSquares?",
      "Is there a free alternative to DarkSquares?",
      "Is DarkSquares free?",
    ],
    keywords: {
      primary: "memory chess vs darksquares",
      secondary: [
        "darksquares alternative",
        "darksquares position memory",
        "darksquares pricing",
        "blindfold chess trainer comparison",
      ],
    },
  },
  comparison: {
    checkedAt: "2026-10-20T00:00:00.000Z",
    disclosure: "Memory Chess publishes this page, so it is one side of the comparison. Every fact about DarkSquares comes from DarkSquares' own public pages.",
  },
  intro: {
    quickAnswer: "DarkSquares is a full blindfold chess course, with seven levels from square colours to blindfold games against Stockfish. Its position memory drill is one part of it. Memory Chess does only position memory, from 2 to 32 pieces, with no account and in 24 languages. Pick DarkSquares to learn to play blindfold, and Memory Chess for recall alone.",
    takeaways: [
      "DarkSquares has more kinds of training, with seven levels, blindfold games, voice moves, famous games and endgames.",
      "DarkSquares is free to start. Pro Lifetime is a one-time €39 launch price, €59 regular.",
      "Memory Chess is free, with no paid tier and no account.",
      "DarkSquares' position memory uses fixed tiers. Memory Chess lets you set the piece count and the look time.",
    ],
    audience: [
      "Players choosing between the two for board memory.",
      "Anyone who has used one and wants to know what the other adds.",
    ],
  },
  sections: [
    {
      id: "feature-table",
      heading: "Feature by feature",
      blocks: [
        {
          kind: "table",
          columns: ["Feature", "DarkSquares", "Memory Chess"],
          rows: [
            {
              label: "Price",
              cells: ["Free tier. Pro Lifetime €39 one-time, a launch price with €59 regular.", "Free. No paid tier."],
            },
            {
              label: "Account",
              cells: [
                "Not needed to start. A free account adds saved progress, streaks, XP and the leaderboard.",
                "Not needed. A name and a country only to join the leaderboard.",
              ],
            },
            {
              label: "Runs on",
              cells: ["Web, iPhone, iPad and Android, with one account across them.", "Any web browser."],
            },
            {
              label: "Site languages",
              cells: [
                "Nine. English, French, Spanish, German, Hindi, Portuguese, Italian, Turkish and Polish.",
                "24. The Learn guides are in English only.",
              ],
            },
            {
              label: "Position memory",
              cells: [
                "Three tiers. 3 to 8 pieces, 9 to 16 pieces in 60 seconds, 17 to 24 pieces in 120 seconds.",
                "Any count from 2 to 32 pieces and any look from 1 to 60 seconds.",
              ],
            },
            {
              label: "Score after a round",
              cells: ["Not stated on the position memory pages.", "An accuracy percentage, with extra pieces costing points."],
            },
            {
              label: "Rating and rewards",
              cells: ["XP and achievements.", "A skill rating for each rated round."],
            },
            {
              label: "Leaderboard",
              cells: ["Weekly, monthly and all-time.", "Today's daily board and four difficulty levels."],
            },
            {
              label: "Blindfold games",
              cells: ["Yes, against Stockfish at 8 levels. Levels 1 to 5 are free, 6 to 8 need Pro.", "No."],
            },
            {
              label: "Course",
              cells: ["Seven levels, and an 8-lesson blindfold method.", "Learn guides with drills, no levels."],
            },
            {
              label: "Voice moves",
              cells: ["Yes. One voice game a day free, unlimited with Pro.", "No."],
            },
            {
              label: "Famous games and endgames",
              cells: ["6 famous games and 3 endgame drills free, all with Pro.", "No."],
            },
          ],
        },
      ],
    },
    {
      id: "where-darksquares-is-ahead",
      heading: "Where DarkSquares is ahead",
      blocks: [
        {
          kind: "list",
          ordered: false,
          items: [
            "Blindfold play. You can play full games against an engine with as much of the board hidden as you like. Memory Chess has no games at all.",
            "A course. Seven levels take you from square colours to full blindfold games, each with a skill to check before you move on.",
            "Mobile apps. DarkSquares has iPhone, iPad and Android apps. Memory Chess runs only in a browser.",
            "Range of drills. Knight and bishop routes, attack detection, tactics solved in your head, voice input and famous games.",
          ],
        },
      ],
    },
    {
      id: "where-memory-chess-differs",
      heading: "Where Memory Chess differs",
      blocks: [
        {
          kind: "list",
          ordered: false,
          items: [
            "It has no paid tier, so nothing is held back for buyers.",
            "You set the round. Any piece count from 2 to 32 and any look from 1 to 60 seconds, not three fixed tiers.",
            "Every round returns an accuracy figure and moves a skill rating, and a daily board gives every player the same position.",
            "The site is in 24 languages against DarkSquares' 9.",
            "It does one job. If you want only position recall, there is less to choose between.",
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "Some of DarkSquares' pages disagree with each other. Its pricing page lists four board visibility modes and its play page lists five. The play page says no signup is needed, and also offers one free guest game before asking you to sign up. Whether the expert memory tier needs Pro is not stated.",
          ],
        },
      ],
    },
  ],
  end: [
    {
      kind: "cta",
      target: { kind: "game", label: "Play 12 pieces, 8 seconds", pieceCount: 12, memorizeTime: 8 },
      why: "Twelve pieces in eight seconds is the hard preset, the size of DarkSquares' middle tier with far less time to look.",
    },
    {
      kind: "furtherReading",
      items: [
        {
          kind: "guide",
          slug: "chess-position-memory-trainers-compared",
          reason: "The other position-memory trainers in the same tables.",
        },
        {
          kind: "guide",
          slug: "blindfold-chess-training-for-beginners",
          reason: "A route to blindfold games that uses recall rounds as its first stage.",
        },
      ],
    },
    {
      kind: "sources",
      items: [
        { title: "DarkSquares: Pricing", url: "https://darksquares.net/pricing" },
        { title: "DarkSquares: Training", url: "https://darksquares.net/train" },
        { title: "DarkSquares: Position Memory", url: "https://darksquares.net/train/position-memory" },
        { title: "DarkSquares: Intermediate position memory", url: "https://darksquares.net/train/position-memory-intermediate" },
        { title: "DarkSquares: Expert position memory", url: "https://darksquares.net/train/position-memory-expert" },
        { title: "DarkSquares: Play blindfold chess", url: "https://darksquares.net/play" },
        { title: "DarkSquares: Learn", url: "https://darksquares.net/learn" },
        { title: "DarkSquares: Leaderboard", url: "https://darksquares.net/leaderboard" },
      ],
    },
  ],
};

export default guide;
