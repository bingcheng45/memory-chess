import type { LearnDocument } from "../schema";

const guide: LearnDocument = {
  meta: {
    slug: "how-to-think-in-chess-for-beginners",
    title: "How to Think in Chess: 3 Questions Before Every Move",
    h1: "How to think in chess for beginners",
    description: "Learn how to think in chess with three questions asked in a fixed order, a one-sentence rule for when to move, and a clock budget for 10-minute games.",
    group: "foundations",
    level: "beginner",
    publishedAt: "2026-03-24T00:00:00.000Z",
    updatedAt: "2026-10-13T00:00:00.000Z",
    questions: [
      "What should I think about before each move?",
      "How do I stop moving too fast in chess?",
      "When should I stop thinking and move?",
      "How should I use my clock in a 10-minute game?",
    ],
    keywords: {
      primary: "how to think in chess",
      secondary: [
        "beginner chess thought process",
        "what to think about in chess",
        "chess candidate moves for beginners",
        "when to move in chess",
        "chess time management beginners",
      ],
    },
  },
  intro: {
    quickAnswer: "Learning how to think in chess starts with three questions, asked in the same order before every move. What did my opponent's last move change? What do I want from this move? Is my chosen move safe? Move when you can say the move, its aim and its safety check in one sentence.",
    takeaways: [
      "Ask what the last move changed before you ask what you want.",
      "One aim per move gives you two or three candidate moves.",
      "Let go of the piece only when the one-sentence reason comes out.",
    ],
    audience: [
      "Beginners who move on impulse in calm positions and freeze the moment something is attacked.",
      "Players who have read that they should calculate and do not know what to calculate about.",
      "Anyone who runs out of clock in ten-minute games without knowing where it went.",
    ],
  },
  sections: [
    {
      id: "fast-and-slow",
      heading: "Why beginners move too fast or think too long",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "The instant mover and the long starer look like opposites. Both are thinking without a question, so one plays whatever looks nice and the other waits for a certainty that never comes.",
            "A routine fixes both. It starts with a question you answer by looking, and it ends with a sentence you can say. The sentence slows the fast mover and releases the slow one.",
          ],
        },
      ],
    },
    {
      id: "three-questions-in-order",
      heading: "The three questions to ask before every move",
      blocks: [
        {
          kind: "list",
          ordered: true,
          items: [
            "What changed? Look at your opponent's last move. Name what it attacks now, what line it opened and what it stopped defending.",
            "What do I want? Pick one aim for this move, such as developing a piece, defending what is attacked or improving your worst piece. The aim should give you two or three candidate moves.",
            "Is it safe? Take the candidate you like best and check what it leaves undefended and what it stops guarding. If it fails, try the next candidate before you invent a new aim.",
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "Keep the order. Once you like a plan, it is easy to see only the moves that serve it.",
            "Try the three questions as Black after 1.e4 e5 2.Nf3.",
          ],
        },
        {
          kind: "board",
          position: {
            id: "after-nf3",
            line: ["e4", "e5", "Nf3"],
            claims: [
              { kind: "attacks", from: "f3", squares: ["e5"] },
              { kind: "attacked", side: "b", squares: ["e5"] },
            ],
          },
          arrows: [{ from: "f3", to: "e5", kind: "attack" }],
          marks: [{ square: "e5", kind: "ring" }],
          caption: "After 2.Nf3 the knight attacks the pawn on e5, and no other Black piece is under attack.",
        },
        {
          kind: "prose",
          paragraphs: [
            "Question one takes a second. The knight on f3 attacks e5, and nothing else.",
            "For question two, pick the aim of keeping the pawn while you develop. That aim gives two candidates, 2...Nc6 and 2...d6, and both defend e5.",
            "2...Nf6 is also good. It attacks the undefended pawn on e4 but leaves e5 undefended. It serves a different aim, counterattack, so it waits unless you switch aims on purpose.",
            "Question three passes 2...Nc6. The pawn on e5 is now defended, and no other Black piece is attacked. Nothing hangs, so the knight goes to c6.",
          ],
        },
      ],
      facts: [
        {
          id: "after-nc6",
          line: ["e4", "e5", "Nf3", "Nc6"],
          claims: [
            { kind: "attackers", square: "e5", side: "b", from: ["c6"] },
            { kind: "attacked", side: "b", squares: ["e5"] },
          ],
        },
        {
          id: "after-d6",
          line: ["e4", "e5", "Nf3", "d6"],
          claims: [{ kind: "attackers", square: "e5", side: "b", from: ["d6"] }],
        },
        {
          id: "after-nf6",
          line: ["e4", "e5", "Nf3", "Nf6"],
          claims: [
            { kind: "attacks", from: "f6", squares: ["e4"] },
            { kind: "attackers", square: "e4", side: "w", from: [] },
            { kind: "attackers", square: "e5", side: "b", from: [] },
          ],
        },
      ],
    },
    {
      id: "stop-rule",
      heading: "When to stop thinking and make your move",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "You are done when one sentence names the move, the aim it serves and the safety check it passed. In the example, that sentence is “Nc6 develops, keeps e5 and hangs nothing.”",
            "In a slow game, if a minute passes with no new candidate, play the safest developing move on your list. Staring longer only spends clock.",
          ],
        },
        {
          kind: "takeaway",
          title: "Certain or tired?",
          body: "Tired can feel like certainty from the inside, so the stop rule is a sentence you can say out loud. If you reach for the piece and the sentence will not come, keep thinking.",
        },
      ],
    },
    {
      id: "clock-budget",
      heading: "How to use your clock in a 10-minute game",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Material changes hands at captures and checks, so a miscount there costs the most. Keep quiet moves short and spend the saved time there.",
          ],
        },
        {
          kind: "plan",
          steps: [
            {
              label: "Opening moves you know",
              duration: "5 seconds",
              detail: "Question one only. If the last move is the one you expected, play the reply you know.",
            },
            {
              label: "Quiet move, nothing attacked",
              duration: "10 seconds",
              detail: "All three questions with one candidate. Pick the aim, check the move and play it.",
            },
            {
              label: "After a capture or a check",
              duration: "Up to 30 seconds",
              detail: "All three questions. Count the exchange until the captures stop, then decide.",
            },
            {
              label: "Under one minute left",
              duration: "5 seconds",
              detail: "Question one only. Answer what the last move attacks, then play.",
            },
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "Over a 40-move game, ten known opening moves at 5 seconds take under a minute. Twenty-two quiet moves at 10 seconds take under four minutes. Eight captures or checks at 30 seconds take four minutes. That leaves about a minute and a half for the one position that needs it.",
          ],
        },
      ],
    },
    {
      id: "done-button",
      heading: "Practise the moment you commit with a Memory Chess round",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "A Memory Chess round shows a position, clears the board and asks you to rebuild it. While the position is showing, a Done button ends the look early. The result then shows the study time you actually used.",
            "The leaderboard ranks rounds by correct pieces first, then fewest wrong pieces, and only then by shorter study time. An early Done never makes up for a missed piece. That is the same bargain as letting go of a piece in a game.",
                      ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Done when certain",
              description: "Play 5 rounds of 6 pieces with 20 seconds to look. Press Done the moment you can name all six squares in your head. A miss after a short look means you stopped early, often because holding the picture got dull.",
              duration: "5 rounds, about 6 minutes",
              goal: "Five perfect rounds, each ended with Done before the 20 seconds ran out.",
              play: { label: "Play 6 pieces, 20 seconds", pieceCount: 6, memorizeTime: 20 },
            },
            {
              title: "One-sentence move",
              description: "Play a slow game against a computer. Before every move, say the stop-rule sentence out loud, with the move, the aim and the safety check. If the sentence will not come, keep thinking.",
              duration: "One slow game",
              goal: "No piece leaves your hand before its sentence is said.",
            },
          ],
        },
      ],
    },
  ],
  end: [
    {
      kind: "cta",
      target: {
        kind: "game",
        label: "Play 6 pieces with 20 seconds to look",
        pieceCount: 6,
        memorizeTime: 20,
      },
      why: "Twenty seconds on six pieces leaves time to spare, so the only decision is when you press Done.",
    },
    {
      kind: "faq",
      items: [
        {
          question: "How many moves ahead should a beginner think?",
          answer: "As far as the captures and checks go, and no further. On a quiet move, look at your move and the reply it allows. After a capture or check, keep counting until the captures stop. Deeper lines come later, once you can hold a two-move line in your head without losing the position.",
        },
        {
          question: "What if none of my candidate moves feels good?",
          answer: "Play the safest developing move and save the time for the next move. When every option feels bad, you usually have no aim yet. Go back to question two, pick one aim, such as developing your least active piece, and the candidates follow from it.",
        },
        {
          question: "Should I use the three questions in blitz?",
          answer: "Learn them in slower games first, because blitz leaves only a few seconds a move. In blitz, ask question one on every move and all three after captures and checks. The one-sentence rule matters even more there, since one long stare costs a large share of the clock.",
        },
      ],
    },
    {
      kind: "furtherReading",
      items: [
        {
          kind: "guide",
          slug: "how-to-get-better-at-chess-for-beginners",
          reason: "The four-week beginner plan that teaches the safety question these three questions build on.",
        },
        {
          kind: "guide",
          slug: "how-to-stop-blundering-in-chess",
          reason: "Turns the safety check into a full scan for checks, captures, threats and loose pieces.",
        },
        {
          kind: "guide",
          slug: "chess-calculation-exercises-for-beginners",
          reason: "Practises the counting that a capture or check asks for before you decide.",
        },
        {
          kind: "guide",
          slug: "how-to-analyze-chess-games-for-beginners",
          reason: "Shows how to find, after the game, which of the three questions you skipped.",
        },
      ],
    },
  ],
};

export default guide;
