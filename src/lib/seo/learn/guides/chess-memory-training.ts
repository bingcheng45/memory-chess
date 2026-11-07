import type { LearnDocument } from "../schema";

const guide: LearnDocument = {
  meta: {
    slug: "chess-memory-training",
    title: "Chess Memory Training: A 6-to-12 Piece Ladder",
    h1: "Chess memory training with a score that tells you when to move up",
    description: "Begin chess memory training at 6 pieces with a 10-second look. Add two pieces after three perfect rounds in a row, and climb to 12 pieces at 8 seconds.",
    group: "memory",
    level: "beginner",
    publishedAt: "2026-03-06T00:00:00.000Z",
    updatedAt: "2026-10-20T00:00:00.000Z",
    questions: [
      "How do I train my chess memory?",
      "Is 4 out of 6 a good score in Memory Chess?",
      "When should I add more pieces to a memory round?",
    ],
    keywords: {
      primary: "chess memory training",
      secondary: [
        "chess memory drills",
        "memorize chess positions",
        "board recall training",
        "memory chess accuracy",
        "chess memory game score",
      ],
    },
    featured: true,
  },
  intro: {
    quickAnswer: "Chess memory training means looking at a position for a few seconds, rebuilding the board from memory and scoring it square by square. Five rungs take you from 6 pieces to 12. Keep the look at 10 seconds until 12 pieces comes back perfect three times in a row, then lower it to 8.",
    takeaways: [
      "A piece scores only when its square, type and colour all match, so a near miss is a miss.",
      "At 6 pieces one missed piece already costs 17 points, so the result messages are blunt at low counts.",
      "Each piece beyond the round's count costs ten points, so stop placing once you reach the count.",
      "Every round is a fresh position, so judge yourself by rounds in a row at the same settings.",
    ],
    audience: [
      "Players who lose the position the moment the board clears.",
      "Anyone who has played a few rounds and does not know whether 4 out of 6 is good.",
      "Anyone about to jump straight to the 20-piece preset.",
    ],
  },
  sections: [
    {
      id: "how-a-rebuilt-board-is-scored",
      heading: "How a rebuilt board is scored",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Memory Chess compares your board with the original square by square. A piece counts only when its square, type and colour all match. A white knight on f3 when the original had it on e3 is wrong. So is a black rook on a8 when that rook was white.",
            "An extra piece is any piece beyond the round's count. Each extra piece is listed as wrong and also takes ten points off your accuracy, which never drops below zero. With five right and one wrong already on a 6-piece board, a seventh piece drops 83 percent to 73. So stop placing once you reach the count.",
          ],
        },
        {
          kind: "takeaway",
          title: "Place the kings first",
          body: "Every position holds exactly one king of each colour, and the two kings never stand on adjacent squares. Their type is never in doubt, so you only have to remember two squares.",
        },
      ],
    },
    {
      id: "bands-at-six-pieces",
      heading: "What 4 out of 6 means in the result bands",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "The message on the result screen comes straight from your accuracy. 100 percent is Perfect Score, 90 or more is Excellent Memory, 80 is Great Job, 70 is Well Done and 50 is Good Effort. Below 50 the screen says Keep Practicing. Those are the only six messages, and the thresholds are the same at every piece count.",
            "At 6 pieces each piece is worth about 17 points, so the steps are steep. Four out of 6 is 67 percent, Good Effort. It means two pieces were missing or wrong. Before you start the next round, find those two pieces on the result board and note what kind of piece each was.",
            "With no extra pieces on the board, a 6-piece round goes straight from Great Job at five correct to Perfect Score at six. So it never shows Excellent Memory. Six correct plus one extra piece shows Excellent Memory, at 90, which is why the piece count tells you more than the message. The table shows how much one miss costs at 6 pieces against 12.",
          ],
        },
        {
          kind: "table",
          columns: ["Your rebuild", "At 6 pieces", "At 12 pieces"],
          rows: [
            { label: "All correct", cells: ["100 percent, Perfect Score", "100 percent, Perfect Score"] },
            { label: "All correct plus one extra piece", cells: ["90 percent, Excellent Memory", "90 percent, Excellent Memory"] },
            { label: "All but one correct", cells: ["83 percent, Great Job", "92 percent, Excellent Memory"] },
            { label: "All but two correct", cells: ["67 percent, Good Effort", "83 percent, Great Job"] },
            { label: "All but three correct", cells: ["50 percent, Good Effort", "75 percent, Well Done"] },
          ],
        },
      ],
    },
    {
      id: "ladder-six-to-twelve",
      heading: "The ladder from 6 pieces to 12",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "If you have never played, start with one round of the 2-piece preset. It holds only the two kings and teaches the controls: pick a type and colour, tap a square, tap again to remove. After that round it has nothing left to teach, so the ladder starts at 6. The table shows the five rungs and the result that moves you up from each.",
          ],
        },
        {
          kind: "table",
          columns: ["Rung", "Pieces and look", "Move on after"],
          rows: [
            { label: "1", cells: ["6 pieces, 10 seconds, the medium preset", "Three Perfect Score rounds in a row"] },
            { label: "2", cells: ["8 pieces, 10 seconds, custom", "Three Perfect Score rounds in a row"] },
            { label: "3", cells: ["10 pieces, 10 seconds, custom", "Three Perfect Score rounds in a row"] },
            { label: "4", cells: ["12 pieces, 10 seconds, the hard preset count with a longer look", "Three Perfect Score rounds in a row"] },
            { label: "5", cells: ["12 pieces, 8 seconds, the hard preset", "Excellent Memory or Perfect Score in three of four rounds, then try the 20-piece preset"] },
          ],
        },
        {
          kind: "list",
          ordered: false,
          items: [
            "The result screen's Next round button changes one piece at a time. After 90 percent or better it offers one more piece with the same look. Below 50 percent it offers one fewer, down to 3, and in between it keeps the size.",
            "To climb this ladder instead, press Try again, which keeps your settings. After three Perfect Score rounds in a row, press Change settings and add two pieces. The piece count runs from 2 to 32, so every rung exists.",
            "Two rounds in a row below Well Done, which is 70 percent, send you down a rung. Press Change settings, take two pieces away and rebuild the streak there.",
            "Change one setting at a time. Hold the look at 10 seconds until 12 pieces gives three Perfect Score rounds in a row, then drop it to 8. If you change both at once, you cannot tell which one broke.",
            "Rungs 2 and 3 use 8 and 10 pieces. Counts other than 2, 6, 12 and 20 are not preset counts, so those rounds are custom games and stay off the leaderboard. While you climb, that does not matter.",
            "The look time runs from 1 to 60 seconds. Under 5 seconds even 6 pieces leaves less than a second per piece, so save short looks until 12 pieces at 8 seconds feels ordinary.",
          ],
        },
        {
          kind: "drills",
          drills: [
            {
              title: "The honest baseline",
              description: "5 rounds of 6 pieces, 10 seconds, about 5 minutes. Press Try again between rounds. Place the kings first, then only the pieces you are sure of, then submit. Leave guesses off so the result shows what you actually remembered. A lucky guess scores the same as a remembered piece, and a wrong one costs nothing, so guesses make the score claim more than you know.",
              duration: "About 5 minutes",
              goal: "Three Perfect Score rounds in a row before you add a single piece.",
              play: { label: "Play 6 pieces, 10 seconds", pieceCount: 6, memorizeTime: 10 },
            },
            {
              title: "The first climb",
              description: "3 rounds of 8 pieces, 10 seconds, about 4 minutes. Press Try again between rounds. Keep the same routine with two more pieces. After each round, note which pieces you lost: the pawns, the pieces far from the kings, or the last ones you looked at.",
              duration: "About 4 minutes",
              goal: "Three Perfect Score rounds in a row, then move to 10 pieces.",
              play: { label: "Play 8 pieces, 10 seconds", pieceCount: 8, memorizeTime: 10 },
            },
            {
              title: "The hard preset",
              description: "4 rounds of 12 pieces, 8 seconds, about 6 minutes. Press Try again between rounds. Play these once 12 pieces at 10 seconds gives three Perfect Score rounds in a row. Read the board in three or four groups of three or four pieces, starting with the kings. A group is pieces that touch or share a rank or file, such as a pawn pair on f2 and g2.",
              duration: "About 6 minutes",
              goal: "Excellent Memory or Perfect Score, which at this count means at least 11 of the 12, in three of four rounds. Then try the 20-piece preset.",
              play: { label: "Play 12 pieces, 8 seconds", pieceCount: 12, memorizeTime: 8 },
            },
          ],
        },
      ],
    },
    {
      id: "skip-and-try-again",
      heading: "Hide board, Try again, and what the clock records",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Hide board ends the look early. The game records how long you actually looked, and the result screen and the leaderboard use that number. So once you have the board, hide it.",
            "Try again keeps your piece count and look time and deals a new position. Next round also deals a new position, but after 90 percent or better it adds a piece. You never see the same board twice. That suits training, and it means one perfect round might be an easy draw. Three perfect rounds in a row at the same settings is a signal.",
            "On the result board under Review Your Position, a piece you placed is marked correct or wrong placement. An original square you left empty is marked missed square and shows the piece that stood there.",
          ],
        },
      ],
    },
    {
      id: "why-rebuilding-beats-staring",
      heading: "What the research says about recall and grouping",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Rebuilding from an empty board is a recall test, and recall tests help a memory last. Roediger and Karpicke had students study a prose passage, then either reread it or write down what they recalled. A week later the tested students remembered more. On a board, rebuilding is the written recall and staring longer is the rereading.",
            "Gobet and Simon showed strong players several boards in a row for a few seconds each, and the players still recalled much of each one. The authors explain it with templates, large familiar patterns held in long-term memory.",
            "Chase and Simon timed the look at 5 seconds and used middle-game positions of 24 to 26 pieces. Their master recalled about twice as many pieces as their Class A player. On the same pieces set out on random squares, every player recalled only about three or four.",
            [
              "The test goes back to 1944, when Adriaan de Groot showed Max Euwe a 22-piece position for five seconds. ",
              { text: "De Groot's scores for four players", href: "/articles/adriaan-de-groot" },
              " show how wide the gap between a master and a weaker player was.",
            ],
            "Random boards shrink the expert's edge but do not erase it. Gobet and Simon checked thirteen experiments with looks of 10 seconds or less. They put the edge at about one extra piece per 400 Elo points on random boards, against about five on positions from games.",
            "Memory Chess positions are random, so you rarely meet a familiar template, and a strong player's lead over you is smaller here than in a game. The plain groups from the hard-preset drill, pieces that touch or share a rank or file, take the place of templates.",
            "Groups are what make the hard preset possible. Piece by piece, 12 pieces in 8 seconds leaves two thirds of a second each. In three or four groups it leaves two seconds or more each.",
          ],
        },
      ],
    },
  ],
  end: [
    {
      kind: "cta",
      target: { kind: "game", label: "Open the 6-piece, 10-second round", pieceCount: 6, memorizeTime: 10 },
      why: "Rung one is six pieces and ten seconds. Stay there, pressing Try again, until three rounds in a row come back perfect.",
    },
    {
      kind: "cta",
      target: { kind: "stat", tile: "span", label: "Check your memory span" },
      why: "Memory span is the largest piece count, three or more, where you have two rounds at 80 percent or better. It can sit a rung above your ladder, which asks for perfect rounds.",
    },
    {
      kind: "cta",
      target: {
        kind: "article",
        slug: "adriaan-de-groot",
        label: "Adriaan de Groot's 1944 test of chess memory, by the numbers",
      },
      why: "Read de Groot's 1944 memory test, the experiment behind rebuilding a position from a short look.",
    },
    {
      kind: "faq",
      items: [
        {
          question: "Should I go straight to the 20-piece preset?",
          answer: "No. Twenty pieces in five seconds leaves a quarter of a second for each. First reach Excellent Memory or Perfect Score in three of four rounds at 12 pieces and 8 seconds. Before that, 20 pieces is likely to end in Keep Practicing with little to learn from.",
        },
        {
          question: "Does the leaderboard care about speed?",
          answer: "Only as a tiebreak. Entries are ordered by correct pieces, then fewest wrong pieces, then shortest look time, then shortest solution time. A quick skip helps you only against a player with the same correct and wrong counts, so accuracy comes first.",
        },
        {
          question: "Can I train chess memory without the app?",
          answer: "Yes, with a real board and a friend. Have them set up 6 pieces, both kings included, and give you 10 seconds to look. Clear the board and rebuild it, then check square by square. Count a piece only when its square, type and colour match, and treat any extra piece as a miss.",
        },
      ],
    },
    {
      kind: "furtherReading",
      items: [
        {
          kind: "guide",
          slug: "chess-pattern-recognition-drills",
          reason: "Once 12 pieces feels ordinary, learn to read clusters instead of pieces.",
        },
        {
          kind: "guide",
          slug: "chess-calculation-exercises-for-beginners",
          reason: "Where holding a position while the board is empty pays off in a real game.",
        },
        {
          kind: "guide",
          slug: "chess-visualization-exercises",
          reason: "Picture the board with no board in front of you at all.",
        },
      ],
    },
    {
      kind: "sources",
      items: [
        {
          title: "Test-Enhanced Learning: Taking Memory Tests Improves Long-Term Retention",
          note: "Supports the claim that students who took a recall test remembered more a week later than students who reread the passage.",
          url: "https://doi.org/10.1111/j.1467-9280.2006.01693.x",
        },
        {
          title: "Templates in Chess Memory: A Mechanism for Recalling Several Boards",
          note: "Supports the claim that strong players shown several boards briefly could still recall much of each, explained by templates held in long-term memory.",
          url: "https://doi.org/10.1006/cogp.1996.0011",
        },
        {
          title: "Perception in Chess, William G. Chase and Herbert A. Simon, Cognitive Psychology 4, pages 55 to 81 (1973)",
          note: "Supports the 5-second look and the middle-game positions of 24 to 26 pieces.",
          url: "https://andymatuschak.org/prompts/Chase1973.pdf",
        },
        {
          title: "Skill in Chess, Herbert A. Simon and William G. Chase, American Scientist 61(4), pages 394 to 403 (1973)",
          note: "Supports the master recalling about twice as many pieces as the Class A player, and every player recalling about three or four pieces on random boards.",
          url: "https://paulogentil.com/pdf/Skill%20in%20chess.pdf",
        },
        {
          title: "Recall of rapidly presented random chess positions is a function of skill, Fernand Gobet and Herbert A. Simon, Psychonomic Bulletin and Review 3, pages 159 to 163 (1996)",
          note: "Supports the thirteen experiments with looks of 10 seconds or less. Also supports the edge of about one piece per 400 Elo points on random boards, against about five on game positions.",
          url: "https://bura.brunel.ac.uk/bitstream/2438/1346/1/FullText.pdf",
        },
      ],
    },
  ],
};

export default guide;
