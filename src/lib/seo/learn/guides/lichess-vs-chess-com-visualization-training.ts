import type { LearnDocument } from "../schema";

const guide: LearnDocument = {
  meta: {
    slug: "lichess-vs-chess-com-visualization-training",
    title: "Lichess vs Chess.com for Visualization Training",
    h1: "Lichess vs Chess.com for visualization training",
    description: "What Lichess and Chess.com each offer for chess visualization: coordinate drills, blindfold play and puzzles, what is free, and what neither site has.",
    group: "compare",
    level: "improver",
    publishedAt: "2026-10-20T00:00:00.000Z",
    updatedAt: "2026-10-20T00:00:00.000Z",
    questions: [
      "Is Lichess or Chess.com better for visualization training?",
      "Does Chess.com Vision cost money?",
      "Can you play blindfold chess on Lichess?",
    ],
    keywords: {
      primary: "lichess vs chess.com visualization training",
      secondary: [
        "chess.com vision trainer",
        "lichess coordinate trainer",
        "blindfold chess lichess",
        "blindfold chess chess.com",
        "free chess visualization training",
      ],
    },
  },
  comparison: {
    checkedAt: "2026-10-20T00:00:00.000Z",
    disclosure: "Memory Chess publishes this page. It is not affiliated with Lichess or Chess.com, and every fact about them comes from their own public pages.",
  },
  intro: {
    quickAnswer: "Both sites offer a free 30-second coordinate drill and a way to play with the pieces hidden. Lichess makes every feature free with no ads. On Chess.com the Vision trainer is free, but the free account gets 3 puzzles a day. Neither site has a drill that asks you to rebuild a whole position from memory.",
    takeaways: [
      "Lichess's coordinate trainer has a find-the-square mode and a name-the-square mode, timed at 30 seconds or untimed.",
      "Chess.com's Vision trainer drills coordinates, moves, or both, 30 seconds at a time.",
      "Lichess hides the pieces with a Blindfold option in the board menu. Chess.com has Blindfold Chess as a game variant on its website.",
      "Chess.com's paid plans start at Gold, which adds unlimited puzzles and lessons. Lichess Patron is a donation and unlocks no features.",
    ],
    audience: [
      "Players who already use one of the two sites and want to train visualization there.",
      "Anyone deciding whether a paid Chess.com plan is needed for this kind of training.",
    ],
  },
  sections: [
    {
      id: "side-by-side",
      heading: "What each site offers",
      blocks: [
        {
          kind: "table",
          columns: ["Training", "Lichess", "Chess.com"],
          rows: [
            {
              label: "Coordinate drill",
              cells: [
                "Coordinate trainer. Find the square that is named, or name the square that is highlighted.",
                "Vision. Identify squares, make moves, or both.",
              ],
            },
            {
              label: "Time per drill",
              cells: ["30 seconds, or untimed.", "30 seconds."],
            },
            {
              label: "Reading moves",
              cells: ["Not stated on the coordinate trainer page.", "Vision's Moves mode shows a move such as Qd3."],
            },
            {
              label: "Playing with the pieces hidden",
              cells: [
                "A Blindfold option in the board menu on the puzzle page.",
                "Blindfold Chess, a game variant in which all the pieces are invisible. Variants are on the website only.",
              ],
            },
            {
              label: "Rebuilding a whole position",
              cells: [
                "None found on its training, practice or learn pages.",
                "None found on its public pages.",
              ],
            },
            {
              label: "Puzzles on a free account",
              cells: ["No limit stated. Every feature is free.", "3 a day. Gold and above are unlimited."],
            },
            {
              label: "Cost",
              cells: [
                "Free for everyone. Patron is a donation that adds wings to your profile.",
                "Free Basic account. Paid plans are Gold, Platinum and Diamond, each with a 7-day trial.",
              ],
            },
            {
              label: "Ads",
              cells: ["None.", "Every paid plan lists No Ads. The free account's ads are not stated."],
            },
          ],
        },
      ],
    },
    {
      id: "where-they-differ",
      heading: "Where the two sites differ",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "The coordinate drills are close. Lichess lets you drill only some files and ranks, and turn the pieces and labels on or off. Chess.com adds a Moves mode, so you practise reading notation as well as squares.",
            "Chess.com's own help page on Vision says it may not directly help your game, though it makes learning easier. That is a fair description of both drills. They teach the map, not what the pieces are doing on it.",
            "For hidden-piece play, Lichess puts Blindfold in the board menu of its puzzle page. A Lichess user's forum post says it is on game pages too, but no official help page states it. Chess.com lists Blindfold Chess among its variants, and its help page says only your opponent's latest move is shown.",
            "Price is the clearest difference. Lichess says all of its features are free for all and forever. Chess.com gives Vision to free accounts, but a free account gets 3 puzzles and one extra lesson a day.",
          ],
        },
      ],
    },
    {
      id: "what-neither-has",
      heading: "What neither site has",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Neither site offers a drill that shows you a full position, hides it and asks you to put every piece back. That is the skill a blindfold game leans on most, and the step between naming squares and playing blind.",
            "Memory Chess, which publishes this page, is a free browser trainer for that one step. It works beside either site, with no account.",
          ],
        },
      ],
    },
  ],
  end: [
    {
      kind: "cta",
      target: { kind: "game", label: "Play 6 pieces, 10 seconds", pieceCount: 6, memorizeTime: 10 },
      why: "Rebuilding six pieces after a ten-second look is the drill neither site offers.",
    },
    {
      kind: "furtherReading",
      items: [
        {
          kind: "guide",
          slug: "memory-chess-vs-lichess-coordinate-trainer",
          reason: "How naming squares and remembering positions fit together.",
        },
        {
          kind: "guide",
          slug: "blindfold-chess-training-for-beginners",
          reason: "A staged route from board recall to full blindfold games.",
        },
      ],
    },
    {
      kind: "sources",
      items: [
        { title: "Lichess: Coordinate training", url: "https://lichess.org/training/coordinate" },
        { title: "Lichess: Features", url: "https://lichess.org/features" },
        { title: "Lichess: Patron", url: "https://lichess.org/patron" },
        { title: "Lichess: Puzzles, board menu with Blindfold", url: "https://lichess.org/training" },
        {
          title: "Lichess forum: Blindfold mode no longer available",
          url: "https://lichess.org/forum/lichess-feedback/blindfold-mode-no-longer-available",
          note: "A user post, not official help.",
        },
        { title: "Chess.com: Vision", url: "https://www.chess.com/vision" },
        { title: "Chess.com help: What is Vision?", url: "https://support.chess.com/en/articles/8615408-what-is-vision" },
        {
          title: "Chess.com help: What does each level of premium membership get me?",
          url: "https://support.chess.com/en/articles/8562418-what-does-each-level-of-premium-membership-get-me",
        },
        { title: "Chess.com help: What is Blindfold chess?", url: "https://support.chess.com/en/articles/8618510-what-is-blindfold-chess" },
        { title: "Chess.com help: How do I play chess variants?", url: "https://support.chess.com/en/articles/8583983-how-do-i-play-chess-variants" },
        { title: "Chess.com: Membership", url: "https://www.chess.com/membership" },
      ],
    },
  ],
};

export default guide;
