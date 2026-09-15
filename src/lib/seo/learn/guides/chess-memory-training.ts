import type { LearnGuide } from "../schema";

const guide: LearnGuide = {
  slug: "chess-memory-training",
  goal: "memory",
  title: "Chess Memory Training: A Ladder Built on the Game's Own Scoring",
  h1: "Chess memory training that the score can actually measure",
  description:
    "How to train position recall with Memory Chess rounds from 2 pieces to 12, using the game's strict square-by-square score to decide when you move up.",
  primaryKeyword: "chess memory training",
  secondaryKeywords: [
    "chess memory drills",
    "memorize chess positions",
    "board recall training",
    "memory chess accuracy",
    "chess memory game score",
  ],
  ctaLabel: "Open the 6-piece, 10-second round",
  quickAnswer:
    "Train at 6 pieces and 10 seconds until you rebuild the whole board three rounds in a row. Only then add pieces, and only after that shorten the look.",
  keyTakeaways: [
    "A piece scores only when its square, type and colour all match, so a near miss is a miss.",
    "At 6 pieces one missed piece already costs 17 points, so the result bands are blunt at low counts.",
    "With all six right, one invented piece still shows Excellent Memory, so read the piece count before the message.",
    "Every round is a fresh position, so the only fair comparison is your accuracy across rounds at the same settings.",
  ],
  whoThisIsFor: [
    "Players who lose the position the moment the board clears.",
    "Anyone who has played a few rounds and does not know whether 4 out of 6 is good.",
    "Anyone about to jump straight to the 20-piece preset.",
  ],
  timeToRead: "9 min read",
  difficulty: "Beginner",
  featured: true,
  publishedAt: "2026-03-06T00:00:00.000Z",
  updatedAt: "2026-09-15T00:00:00.000Z",
  sections: [
    {
      id: "score-counts-exact-squares",
      title: "The score counts exact squares, not a rough picture",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Memory Chess compares your board with the original square by square. A piece counts as correct only when the square, the piece type and the colour all match.",
            "A white knight on f3 when the original had it on e3 is wrong. A black rook on a8 when that rook was white is wrong. There is no half credit.",
            "Extra pieces hurt twice. Each piece you place beyond the position's count is listed as wrong and also takes ten points off your accuracy, which never drops below zero.",
            "So the habit that pays is placing only the pieces you actually remember. One guessed extra piece turns a 6-piece round with five correct from 83 percent into 73.",
          ],
        },
        {
          kind: "callout",
          title: "Why the kings go down first",
          body: "Every position holds exactly one king of each colour, and the two kings are never on adjacent squares. That is two piece types you never have to remember, only two squares.",
        },
      ],
    },
    {
      id: "bands-at-six-pieces",
      title: "What 4 out of 6 means in the result bands",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "The message on the result screen comes straight from your accuracy. 100 percent is Perfect Score, 90 or more is Excellent Memory, 80 is Great Job, 70 is Well Done and 50 is Good Effort.",
            "Below 50 the screen says Keep Practicing. Those are the only six messages, and the thresholds do not change with piece count.",
            "At 6 pieces the arithmetic is blunt. Six correct is 100 percent. Five is 83, Great Job. Four is 67, Good Effort. Three is 50, one piece from Keep Practicing.",
            "With exactly six pieces placed, Excellent Memory needs all six correct, because five correct rounds to 83.",
            "Six correct plus one invented piece also shows Excellent Memory, at 90, which is why the piece count matters more than the message.",
            "At 12 pieces the steps shrink. Eleven correct is 92 and Excellent Memory. Ten is 83. Nine is 75, Well Done. Twelve pieces is where the bands start describing progress.",
          ],
        },
        {
          kind: "comparison",
          columns: ["Correct pieces", "At 6 pieces", "At 12 pieces"],
          rows: [
            {
              label: "All but one",
              struggling: "83 percent, Great Job",
              stronger: "92 percent, Excellent Memory",
            },
            {
              label: "All but two",
              struggling: "67 percent, Good Effort",
              stronger: "83 percent, Great Job",
            },
            {
              label: "All but three",
              struggling: "50 percent, Good Effort",
              stronger: "75 percent, Well Done",
            },
          ],
        },
      ],
    },
    {
      id: "ladder-six-to-twelve",
      title: "The ladder from 6 pieces to 12",
      summary: "The first card is where you climb from. The other two are short sets of four rounds at harder settings, and the promotion rule below sets the pace of the climb.",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "If you have never played, start with one round of the 2-piece preset. It is the two kings and nothing else, and it exists to teach the controls: pick a type and colour, tap a square, tap again to remove.",
            "After that the 2-piece preset has nothing left to teach, so the ladder starts at 6.",
            "Only the first card below is a rung. The other two are four rounds each at settings you are not climbing yet, so you know what is ahead. The second keeps 6 pieces and shortens the look. The third is the 12-piece preset, which adds pieces and shortens the look together. Treat it as a preview, not a rung. The climb itself follows the promotion rule: two pieces at a time, and the look only once the count is stable.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "The honest baseline",
              description:
                "5 rounds of 6 pieces, 10 seconds, about 5 minutes. Kings first, then only the pieces you are sure of, then submit. Do not fill in guesses.",
              duration: "About 5 minutes",
              goal: "Three Perfect Score rounds in a row before you add a single piece.",
              ctaLabel: "Play 6 pieces, 10 seconds",
              setup: { pieceCount: 6, memorizeTime: 10 },
            },
            {
              title: "Same count, shorter look",
              description:
                "4 rounds of 6 pieces, 6 seconds, about 3 minutes. The same six pieces with four seconds less to look. Compare it with the 10-second rounds to see how much those four seconds were doing.",
              duration: "About 3 minutes",
              goal: "Perfect Score in at least two of the four rounds.",
              ctaLabel: "Play 6 pieces, 6 seconds",
              setup: { pieceCount: 6, memorizeTime: 6 },
            },
            {
              title: "Twelve pieces, read in groups",
              description:
                "4 rounds of 12 pieces, 8 seconds, about 6 minutes. Twelve pieces in eight seconds leaves two thirds of a second per piece, so read them in groups. Take the kings, then the pawns as chains, then whatever is left.",
              duration: "About 6 minutes",
              goal: "Excellent Memory, which at this count means at least 11 of the 12.",
              ctaLabel: "Play 12 pieces, 8 seconds",
              setup: { pieceCount: 12, memorizeTime: 8 },
            },
          ],
        },
      ],
    },
    {
      id: "skip-and-try-again",
      title: "Skip, Try Again, and what the clock records",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Skip ends the look early. The game records how long you actually looked rather than the time you were given, and that number is what the result screen and the leaderboard use.",
            "So once you have the board, skip.",
            "Try Again keeps your piece count and look time and generates a new position. You never see the same board twice, which is right for training and wrong for comparing two attempts at one board.",
            "That is why the ladder measures rounds at the same settings rather than attempts at one position. Three perfect rounds in a row is a signal. One perfect round might be an easy draw.",
            "The result screen shows correct pieces out of the total, a red superscript for any extra pieces, your look time and your solution time. On your submitted board, a piece you placed is marked Correct or Incorrect, and an original square you left empty is marked Missed.",
          ],
        },
      ],
    },
    {
      id: "promotion-and-demotion",
      title: "When to add pieces and when to take them away",
      blocks: [
        {
          kind: "steps",
          ordered: true,
          items: [
            "Three Perfect Score rounds in a row at your current settings: add two pieces. Go 6 to 8, 8 to 10, 10 to 12. The piece slider runs from 2 to 32, so every step exists.",
            "Counts other than 2, 6, 12 and 20 make the round a custom game and keep it off the leaderboard. While you are climbing that does not matter.",
            "Two rounds in a row below Well Done, which is 70 percent: take two pieces away and rebuild the streak there.",
            "Shorten the look only once the count is stable. Changing both at once tells you nothing about which one broke.",
            "The look slider runs from 2 to 32 seconds. Under 5 seconds even 6 pieces leaves less than a second per piece, so save short looks until 12 pieces at 8 seconds feels ordinary.",
          ],
        },
      ],
    },
    {
      id: "why-rebuilding-beats-staring",
      title: "Why rebuilding the board beats looking at it longer",
      blocks: [
        {
          kind: "paragraphs",
          paragraphs: [
            "Rebuilding from an empty board is a memory test, and testing helps a memory last. Roediger and Karpicke had students study a passage and then either reread it or take a recall test.",
            "A week later the tested students remembered more than the ones who had reread.",
            "That study used prose passages and says nothing about how long to look at a board. What follows is this guide's suggestion, not its finding: once you have the board, skip, and let the rebuild do the work.",
            "Gobet and Simon showed strong players several boards in a row, a few seconds each, and found they could still recall much of each one. They explain it by familiar chunks, not a bigger raw span.",
            "Memory Chess positions are random, so the chunks you find are geometric rather than chess-typical. A pawn pair on f2 and g2. A king tucked in a corner. Three pieces on one rank.",
            "Look for those geometric chunks as you climb from 6 pieces to 12. Piece by piece, 12 pieces in 8 seconds leaves two thirds of a second each. In three or four chunks it leaves two seconds or more each.",
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: "Is 6 pieces in 10 seconds a good score for a beginner?",
      answer:
        "It is the medium preset, a setting rather than a score. Whatever you get on day one, the target there is six correct three rounds in a row.",
    },
    {
      question: "Should I go straight to the 20-piece preset?",
      answer:
        "No. Twenty pieces in five seconds leaves a quarter of a second for each. Until 12 pieces at 8 seconds gives you Excellent Memory most rounds, 20 is likely to end in Keep Practicing with little to learn from.",
    },
    {
      question: "Does the leaderboard care about speed?",
      answer:
        "Only as a tiebreak. Entries are ordered by correct pieces, then fewest wrong pieces, then shortest look time, then shortest solution time.",
    },
  ],
  relatedArticles: [
    {
      slug: "chess-pattern-recognition-drills",
      reason: "Once 12 pieces feels ordinary, learn to read clusters instead of pieces.",
    },
    {
      slug: "chess-calculation-exercises-for-beginners",
      reason: "Where holding a position while the board is empty pays off in a real game.",
    },
    {
      slug: "chess-visualization-exercises",
      reason: "Picture the board with no board in front of you at all.",
    },
  ],
  sources: [
    {
      title: "Test-Enhanced Learning: Taking Memory Tests Improves Long-Term Retention",
      url: "https://doi.org/10.1111/j.1467-9280.2006.01693.x",
      note: "Supports the claim that students who took a recall test remembered more a week later than students who reread the passage.",
    },
    {
      title: "Templates in Chess Memory: A Mechanism for Recalling Several Boards",
      url: "https://doi.org/10.1006/cogp.1996.0011",
      note: "Supports the claim that strong players shown several boards briefly could still recall much of each, explained by chunking rather than raw span.",
    },
  ],
};

export default guide;
