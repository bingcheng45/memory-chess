import type { LearnDocument } from "../schema";

const guide: LearnDocument = {
  meta: {
    slug: "chess-position-memory-trainers-compared",
    title: "Chess Position Memory Trainers Compared",
    h1: "Chess position-memory trainers compared",
    description: "Trainers that show a chess position, hide it and ask you to rebuild it, compared on price, platforms, piece counts and look times.",
    group: "compare",
    level: "improver",
    publishedAt: "2026-10-20T00:00:00.000Z",
    updatedAt: "2026-10-20T00:00:00.000Z",
    questions: [
      "What is the best app to train chess memory?",
      "Which apps let me rebuild a chess position from memory?",
      "Is there a free chess position memory trainer?",
    ],
    keywords: {
      primary: "chess position memory trainer",
      secondary: [
        "chess memory app",
        "chess memory trainer comparison",
        "rebuild chess position from memory",
        "darksquares position memory",
        "chessable vs position memory",
      ],
    },
  },
  comparison: {
    checkedAt: "2026-10-20T00:00:00.000Z",
    disclosure: "Memory Chess publishes this page and is one of the tools in it. Facts about the others come from their own public pages, or from their source code where a cell says so.",
    products: [
      { name: "Memory Chess", url: "https://thememorychess.com" },
      { name: "DarkSquares Position Memory", url: "https://darksquares.net/train/position-memory" },
      { name: "ChessWorld memory trainer", url: "https://www.chessworld.net/chessclubs/memory-trainer.asp" },
      { name: "BoardWithin", url: "https://boardwithin.com/" },
      { name: "chessO" },
      { name: "Lucas Chess memory exercise", url: "https://lucaschess.pythonanywhere.com/" },
      { name: "Chess Memory (Android)", url: "https://play.google.com/store/apps/details?id=com.chessmemory.app" },
    ],
  },
  intro: {
    quickAnswer: "Six trainers we could check show a position, hide it and ask you to rebuild it. Memory Chess and DarkSquares start free in a browser, BoardWithin costs $4.99 on iPhone and iPad, and Lucas Chess is a free Windows and Linux program. A seventh, chessO, could not be checked. Chessable trains a different skill, learning lines from courses, so it is not in the tables.",
    takeaways: [
      "DarkSquares uses fixed tiers: 3 to 8 pieces, then 9 to 16 pieces in 60 seconds, then 17 to 24 pieces in 120 seconds.",
      "Memory Chess lets you set any count from 2 to 32 pieces and a look of 1 to 60 seconds.",
      "DarkSquares and BoardWithin also teach blindfold play and include blindfold games. Memory Chess and ChessWorld do not.",
      "Lucas Chess, per its source code, reads its positions from a folder of checkmates in grandmaster games. Memory Chess generates new positions instead.",
      "The App Store listing for chessO returned a not-found page, so nothing about it could be checked.",
    ],
    audience: [
      "Players choosing a tool to practise remembering whole positions.",
      "Anyone whose search for a chess memory app turned up opening courses instead.",
    ],
  },
  sections: [
    {
      id: "positions-or-openings",
      heading: "Remembering a position is not memorising an opening",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "A chess memory app can mean two things. One kind drills move sequences, such as the first fifteen moves of your repertoire, until you can play them without thinking. The other kind shows you a position and checks whether you can put every piece back on its square.",
            "Chessable is built around the first kind. Its MoveTrainer page says it turns chess books and videos into interactive courses, and its home page lists openings, tactics, endgame patterns and more. Its MoveTrainer and home pages do not describe a drill that shows a position briefly and then asks you to rebuild it.",
            "The tools below do the second kind, as their own pages describe them. You study a board, the pieces vanish, and you place them again. The tables say what each page states, and \"not stated\" where it is silent.",
          ],
        },
      ],
    },
    {
      id: "price-and-platforms",
      heading: "Price, platforms and accounts",
      blocks: [
        {
          kind: "table",
          columns: ["Trainer", "Price", "Runs on", "Account"],
          rows: [
            {
              label: "Memory Chess",
              cells: [
                "Free.",
                "Any web browser. It can be added to a phone's home screen.",
                "Not needed. Your rounds are kept in your browser.",
              ],
            },
            {
              label: "DarkSquares Position Memory",
              cells: [
                "Free tier. Pro Lifetime is a one-time €39 launch price, €59 regular.",
                "Web, iPhone, iPad and Android.",
                "Not needed to start. A free account adds saved progress, streaks and the leaderboard.",
              ],
            },
            {
              label: "ChessWorld memory trainer",
              cells: ["Not stated.", "Web.", "Not stated. The page shows log-in links."],
            },
            {
              label: "BoardWithin",
              cells: [
                "$4.99 on the US App Store, with no in-app purchases or subscription.",
                "iPhone, iPad and Apple Vision. Macs with an M1 chip or later can run the iPad app, which the listing marks as \"Not verified for macOS\".",
                "Not needed. The listing says training does not require an account or an internet connection.",
              ],
            },
            {
              label: "chessO",
              cells: ["Could not check.", "Its App Store listing returned a not-found page.", "Could not check."],
            },
            {
              label: "Lucas Chess memory exercise",
              cells: [
                "Free and open source, under the GPL 3.0 licence.",
                "Windows and Linux downloads.",
                "Not stated. It is a desktop program.",
              ],
            },
            {
              label: "Chess Memory (Android)",
              cells: [
                "Free on Google Play. Its release notes list ads as work in progress.",
                "Android. 100+ downloads, last updated 14 January 2025.",
                "Not stated.",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "how-a-round-works",
      heading: "Piece counts, look times and scores",
      summary: "Where a number came from a program's source code rather than its page, the cell says so.",
      blocks: [
        {
          kind: "table",
          columns: ["Trainer", "Pieces", "Time to look", "What you get back", "Other training"],
          rows: [
            {
              label: "Memory Chess",
              cells: [
                "Any count from 2 to 32. Presets are 2, 6, 12 and 20.",
                "Any time from 1 to 60 seconds.",
                "An accuracy percentage, a skill rating, a daily board and a leaderboard.",
                "None. It trains position memory only.",
              ],
            },
            {
              label: "DarkSquares Position Memory",
              cells: [
                "3 to 8, then 9 to 16, then 17 to 24.",
                "A few seconds at the first tier, 60 seconds at the second, 120 seconds at the third.",
                "Weekly, monthly and all-time leaderboards. The round score is not stated.",
                "A seven-level blindfold course, Position Reconstruction, and blindfold games against Stockfish, against real players through Lichess, or with a friend.",
              ],
            },
            {
              label: "ChessWorld memory trainer",
              cells: [
                "Easy 3, Medium 5, Hard 8, Grandmaster 12.",
                "10 seconds, set in the page's script. The visible text does not say.",
                "Pieces right out of the total and a percentage, shown by the page's script.",
                "Questions and answers on memory on the same page.",
              ],
            },
            {
              label: "BoardWithin",
              cells: [
                "3 pieces at level 1, rising to full game positions, per its how-to page. Exact counts are not stated.",
                "Not stated for Position Recall. My Training lets you choose 3 to 15 seconds.",
                "An accuracy percentage for each recall, and a Blindfold Score built from training levels 1 to 8, Rapid Challenge, Position Recall, puzzles and the Blindfold Game.",
                "Coordinates, hidden calculation, 100 tactical puzzles and a blindfold game.",
              ],
            },
            {
              label: "chessO",
              cells: ["Could not check.", "Could not check.", "Could not check.", "Could not check."],
            },
            {
              label: "Lucas Chess memory exercise",
              cells: [
                "From its source code, 3 pieces at level 1 and one more each level.",
                "From its source code, a set number of seconds per piece by category.",
                "Your fastest time for each level.",
                "A full chess program to train, play and compete.",
              ],
            },
            {
              label: "Chess Memory (Android)",
              cells: [
                "Easy, normal and hard levels. Counts are not stated.",
                "Not stated.",
                "Not stated. A leaderboard is listed as work in progress.",
                "Puzzles and visualization practice, per its listing.",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "where-each-fits",
      heading: "Where each one fits",
      blocks: [
        {
          kind: "list",
          ordered: false,
          items: [
            "Pick DarkSquares if you want position memory as one step in a full blindfold course. It has more kinds of training than Memory Chess, across seven levels with games against an engine.",
            "Pick BoardWithin if you train on an iPhone or iPad and want one paid app with coordinates, recall and blindfold play together.",
            "Pick Lucas Chess if you use Windows or Linux and want positions from grandmaster games, as its source code shows.",
            "Pick Memory Chess if you want only position memory, with your own piece count and look time, a score after every round and no account.",
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "Positions from real games and generated ones may test slightly different things, which is a judgement, not a measured result. Memory Chess generates legal positions for each round rather than taking them from games.",
          ],
        },
      ],
    },
  ],
  end: [
    {
      kind: "cta",
      target: { kind: "game", label: "Play 6 pieces, 10 seconds", pieceCount: 6, memorizeTime: 10 },
      why: "Six pieces with ten seconds is the medium preset, a fair first test before you choose a tool.",
    },
    {
      kind: "sources",
      items: [
        { title: "DarkSquares: Position Memory", url: "https://darksquares.net/train/position-memory" },
        { title: "DarkSquares: Intermediate position memory", url: "https://darksquares.net/train/position-memory-intermediate" },
        { title: "DarkSquares: Expert position memory", url: "https://darksquares.net/train/position-memory-expert" },
        { title: "DarkSquares: Pricing", url: "https://darksquares.net/pricing" },
        { title: "DarkSquares: Training", url: "https://darksquares.net/train" },
        { title: "DarkSquares: Position Reconstruction", url: "https://darksquares.net/train/position-reconstruction" },
        { title: "DarkSquares: Play blindfold chess", url: "https://darksquares.net/play" },
        { title: "ChessWorld: Chess memory trainer", url: "https://www.chessworld.net/chessclubs/memory-trainer.asp" },
        { title: "BoardWithin", url: "https://boardwithin.com/" },
        { title: "BoardWithin: How to use BoardWithin", url: "https://boardwithin.com/how-to.html" },
        { title: "BoardWithin: Chess memory training", url: "https://boardwithin.com/chess-memory-training.html" },
        { title: "BoardWithin on the App Store", url: "https://apps.apple.com/us/app/boardwithin/id6813888822" },
        { title: "chessO on the App Store", url: "https://apps.apple.com/us/app/chesso/id6747690833", note: "Returned a not-found page." },
        { title: "Lucas Chess", url: "https://lucaschess.pythonanywhere.com/" },
        { title: "Lucas Chess downloads", url: "https://lucaschess.pythonanywhere.com/downloads" },
        { title: "Lucas Chess memory exercise source code", url: "https://github.com/lukasmonk/lucaschessR6" },
        { title: "Chess Memory on Google Play", url: "https://play.google.com/store/apps/details?id=com.chessmemory.app" },
        { title: "Chessable", url: "https://www.chessable.com/" },
        { title: "Chessable: About MoveTrainer", url: "https://www.chessable.com/movetrainer/" },
      ],
    },
  ],
};

export default guide;
