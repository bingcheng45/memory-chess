import type { LearnPosition } from "../positions";
import type { LearnGuide } from "../schema";

const guide: LearnGuide = {
  slug: "how-to-think-in-chess-for-beginners",
  goal: "routine",
  title: "How to Think in Chess for Beginners",
  h1: "How to think in chess for beginners",
  description: "Three questions asked in a fixed order, a stop rule for when to move, and a Memory Chess round that trains the moment you commit.",
  primaryKeyword: "how to think in chess",
  secondaryKeywords: [
    "beginner chess thought process",
    "what to think about in chess",
    "chess candidate moves for beginners",
    "when to move in chess",
    "chess time management beginners",
  ],
  ctaLabel: "Play 6 pieces with 20 seconds to look",
  quickAnswer: "Ask three questions in order on every move. What did the last move change, what do I want here, and is my move safe? Move when you can say the answer in one sentence.",
  keyTakeaways: [
    "Treat moving instantly and staring for minutes as one failure, a think with no question in it.",
    "Ask what changed before asking what you want, because once you like a plan, it is easy to look only for it.",
    "Stop when the one-sentence reason comes out, because tired and certain can feel alike from the inside.",
  ],
  whoThisIsFor: [
    "Beginners who move on impulse in calm positions and freeze the moment something is attacked.",
    "Players who have read that they should calculate and do not know what to calculate about.",
    "Anyone who runs out of clock in ten-minute games without knowing where it went.",
  ],
  timeToRead: "6 min read",
  difficulty: "Beginner",
  publishedAt: "2026-03-24T00:00:00.000Z",
  updatedAt: "2026-09-15T00:00:00.000Z",
  sections: [
    {
      id: "fast-and-slow",
      title: "Moving too fast and thinking too long can be the same mistake",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "The instant mover and the long starer look like opposites at the board. Both can be missing a question to answer, so one plays whatever looks nice and the other waits for a certainty that never comes.",
            "A routine gives a think the beginning and the end that both habits can lack. The beginning is a question you answer by looking. The end is a sentence you can say.",
            "Everything in between is short, and it is the same on move five as on move forty.",
          ],
        },
      ],
    },
    {
      id: "three-questions-in-order",
      title: "What changed, what do I want, is it safe?",
      blocks: [
        {
          kind: "steps",
          ordered: true,
          items: [
            "What changed? Take the opponent's last move and name what it now attacks, what line it opened, and what it stopped defending.",
            "What do I want? Pick one aim for this move, such as developing a piece, defending what is attacked, or improving your worst piece. The aim should give two or three candidates.",
            "Is it safe? For the candidate you like best, check what it leaves undefended and what it stops guarding. If it fails, try the next candidate before inventing a new plan.",
          ],
        },
        {
          kind: "paragraphs",
          paragraphs: [
            "Try it after 1.e4 e5 2.Nf3. Question one has a short answer. The knight on f3 attacks the pawn on e5, and no other Black piece is attacked.",
            "Question two is to keep the pawn while developing. That aim gives 2...Nc6 and 2...d6, which both defend e5.",
            "A third move, 2...Nf6, hits the undefended pawn on e4 but leaves e5 undefended. It belongs to a different aim, counterattack, so it waits unless you change the aim on purpose.",
            "Question three passes 2...Nc6. It keeps e5 defended, and no other Black piece is attacked, so nothing hangs and the knight goes to c6.",
            "The order is the point. Ask what you want before asking what changed, and it is easy to see only your plan.",
          ],
        },
      ],
    },
    {
      id: "stop-rule",
      title: "Move when the reason fits in one sentence",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "You are done thinking when one sentence names the move, the aim it serves, and the safety check it passed. “Nc6, it develops and keeps e5, and nothing hangs” is that sentence.",
            "If a full minute passes and no new candidate has appeared, play the safest developing move on your list. Staring longer with no new candidate only spends clock.",
          ],
        },
        {
          kind: "callout",
          title: "Certain or tired?",
          body: "Tired can feel like certainty from the inside, which is why the stop rule is a sentence and not a feeling. If you reach for the piece and the sentence will not come, keep thinking.",
        },
      ],
    },
    {
      id: "skip-round",
      title: "Training the moment you commit with the Skip button",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "In a Memory Chess round, a Skip button ends the phase early while the position is still showing. The game then records how long you actually looked, not the seconds you were given.",
            "The leaderboard orders rounds by correct pieces, then fewest wrong pieces, and only then by shorter look time. Look time separates only rounds that scored the same.",
            "So an early Skip pays only when you were right to be sure. That is the same bargain as letting go of a piece in a game.",
            "A bad skip has a recognisable shape. You have the picture, holding it has become tedious, and you press Skip before checking the last piece.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "Skip when certain",
              description: "Play 5 rounds of 6 pieces with 20 seconds to look. Press Skip the moment you can name all six squares in your head. A skipped round with a miss may mean you stopped early.",
              duration: "5 rounds, about 6 minutes",
              goal: "Learn what certainty feels like before the clock decides for you.",
              ctaLabel: "Play 6 pieces, 20 seconds",
              setup: {
                pieceCount: 6,
                memorizeTime: 20,
              },
            },
            {
              title: "One-sentence move",
              description: "Play a slow game against a computer. Before every move, say the stop-rule sentence out loud with the move, the aim and the safety check. If the sentence will not come, keep thinking.",
              duration: "15 minutes",
              goal: "Make the sentence the thing that releases the piece.",
              ctaLabel: "Say the sentence first",
            },
          ],
        },
      ],
    },
    {
      id: "clock-budget",
      title: "Where the clock goes in a 10-minute game",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "The routine is short on purpose, so the clock can go where material changes hands. Here is one budget for a ten-minute game.",
          ],
        },
        {
          kind: "plan",
          steps: [
            {
              label: "Opening moves you know",
              duration: "5 seconds",
              detail: "Question one only. If the last move changed nothing you did not expect, play the move you know.",
            },
            {
              label: "Quiet move, nothing attacked",
              duration: "20 seconds",
              detail: "All three questions. One candidate is enough when nothing is attacked, so pick the aim and check the move.",
            },
            {
              label: "After a capture or check",
              duration: "Up to a minute",
              detail: "All three questions, and count the exchange to its end before you decide. Stop counting when the captures stop.",
            },
            {
              label: "Under one minute left",
              duration: "5 seconds",
              detail: "Question one only. Say what the last move attacks, answer it if you must, and play.",
            },
          ],
        },
        {
          kind: "paragraphs",
          paragraphs: [
            "Material changes hands at captures and checks, so a miscount there costs the most. The five-second opening moves are what pay for those minutes.",
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: "How many moves ahead should a beginner think?",
      answer: "As far as the captures and checks go and no further. On a quiet move that is one move, and after a capture it is until the taking stops.",
    },
    {
      question: "What if none of my options feels good?",
      answer: "Play the safest developing move and spend the saved time on the next move. When every option feels bad, you may have no aim yet, and question two supplies one.",
    },
    {
      question: "Should I use the routine in blitz?",
      answer: "Use question one on every move and the other two after captures and checks. The stop rule matters more in blitz, because a long stare costs a bigger share of the clock.",
    },
  ],
  relatedArticles: [
    {
      slug: "how-to-stop-blundering-in-chess",
      reason: "Turns the safety question into a full scan for checks, captures, threats and loose pieces.",
    },
    {
      slug: "chess-calculation-exercises-for-beginners",
      reason: "Practises the counting that a capture or check asks for before you decide.",
    },
    {
      slug: "how-to-analyze-chess-games-for-beginners",
      reason: "Shows how to find, after the game, which of the three questions you skipped.",
    },
  ],
  sources: [],
};

const OPENING = ["e4", "e5", "Nf3"];

export const positions: LearnPosition[] = [
  {
    id: "after-nf3",
    sectionId: "three-questions-in-order",
    line: OPENING,
    claims: [
      { kind: "attacked", side: "b", squares: ["e5"] },
      { kind: "attackers", square: "e4", side: "w", from: [] },
    ],
  },
  {
    id: "after-nc6",
    sectionId: "three-questions-in-order",
    line: [...OPENING, "Nc6"],
    claims: [
      { kind: "attackers", square: "e5", side: "b", from: ["c6"] },
      { kind: "attacked", side: "b", squares: ["e5"] },
    ],
  },
  {
    id: "after-d6",
    sectionId: "three-questions-in-order",
    line: [...OPENING, "d6"],
    claims: [{ kind: "attackers", square: "e5", side: "b", from: ["d6"] }],
  },
  {
    id: "after-nf6",
    sectionId: "three-questions-in-order",
    line: [...OPENING, "Nf6"],
    claims: [
      { kind: "attacks", from: "f6", squares: ["e4"] },
      { kind: "attackers", square: "e4", side: "w", from: [] },
      { kind: "attackers", square: "e5", side: "b", from: [] },
    ],
  },
];

export default guide;
