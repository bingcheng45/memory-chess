export const CHANGELOG_ANNOUNCEMENT_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
export const CHANGELOG_DISMISSAL_STORAGE_KEY =
  "memory-chess-dismissed-changelog-version";

export interface ChangelogEntry {
  version: string;
  publishedAt: string;
  title: string;
  summary: string;
  groups: readonly ChangelogGroup[];
}

export interface ChangelogGroup {
  title: string;
  description?: string;
  changes?: readonly ChangelogChange[];
  tables?: readonly ChangelogTable[];
  note?: string;
}

export type ChangelogChange =
  | string
  | {
      segments: readonly (string | ChangelogLink)[];
    };

export interface ChangelogLink {
  text: string;
  href: string;
}

export interface ChangelogTable {
  caption: string;
  columns: readonly string[];
  rows: readonly {
    label: string;
    values: readonly string[];
  }[];
}

export const CHANGELOG_ENTRIES: readonly ChangelogEntry[] = [
  {
    version: "2.0.0",
    publishedAt: "2026-10-13T23:15:00.000+08:00",
    title: "Memory Chess 2.0: a daily board, your own dashboard, and a whole new look",
    summary:
      "The biggest update since launch. There is a new board every day that everyone plays, a dashboard that shows how your memory is changing, a result screen that tells you what each round did to your numbers, and a fresh design in all 24 languages.",
    groups: [
      {
        title: "A new board every day",
        description:
          "Once a day, everyone gets the same position. You get one try, and today's top scores sit on their own leaderboard.",
        changes: [
          {
            segments: [
              "Open the ",
              { text: "daily board", href: "/daily" },
              " to play. The position stays hidden until you start, so nobody gets a head start.",
            ],
          },
          "The week has a rhythm: a gentle board on Monday, a little harder each day, a speed test on Saturday and one big board on Sunday.",
          "The game screen shows a countdown to the next board, and your dashboard shows a dot when today's board is waiting.",
          "The leaderboard has a new Daily tab, with the reset time shown in your own time zone.",
        ],
        tables: [
          {
            caption: "What each day asks of you",
            columns: ["Pieces", "Time to look"],
            rows: [
              { label: "Monday", values: ["4 to 5", "12 seconds"] },
              { label: "Tuesday", values: ["5 to 6", "10 seconds"] },
              { label: "Wednesday", values: ["6 to 7", "10 seconds"] },
              { label: "Thursday", values: ["7 to 8", "9 seconds"] },
              { label: "Friday", values: ["8 to 9", "8 seconds"] },
              { label: "Saturday", values: ["6 to 12", "2 to 6 seconds"] },
              { label: "Sunday", values: ["12 to 32", "12 seconds"] },
            ],
          },
        ],
      },
      {
        title: "Your dashboard",
        description: "Every number the game knows about your memory, on one page that grows as you play.",
        changes: [
          {
            segments: [
              "The new ",
              { text: "Dashboard", href: "/dashboard" },
              " shows your skill rating and which way it is heading, your memory span, how many pieces you hold, your speed, your accuracy, your win streak, the days you have played and your recent rounds.",
            ],
          },
          "Figures that need a few more rounds say exactly what they are waiting for, with a button to play the round that unlocks them.",
          "A small Day chip in the header counts your streak of days played. Tap it to open your dashboard from any page.",
          "Everything is kept on your own device. You can download it as a file and bring it back on another browser.",
        ],
      },
      {
        title: "See what every round did",
        changes: [
          "After each round, the result screen lists your dashboard figures before and after, with a green arrow when a number got better and a red one when it slipped.",
          "A short note at the top tells you your updated stats are waiting just below, with a button that takes you straight there.",
          "Your win streak now counts properly and your round history is kept.",
        ],
      },
      {
        title: "A skill rating that moves both ways",
        description:
          "The old rating only ever went up, so every player drifted toward the top. It has been rebuilt, and everyone starts again at 1000.",
        changes: [
          "Your first ten rated rounds place you. More pieces count most, then a shorter look at the board, then a faster rebuild. A board you mostly missed earns nothing for how hard it was.",
          "After that, each round moves your rating up or down by how you did against how hard the board was. Clear boards above your level to climb. Miss easy ones and it drops.",
          "A board harder than the ones you usually play earns more when you clear it and costs less when you miss it. An easier one earns little and costs more.",
          "Review rounds are still not rated. The daily board is.",
        ],
      },
      {
        title: "Share a round, and let friends watch it back",
        changes: [
          "Share a result or your dashboard as an image card. Post it to X, Facebook, LinkedIn, Reddit, WhatsApp, Threads or Bluesky in one tap, or download or copy it.",
          "The link you share shows your card in the post, and opens a page that replays your round: the position you studied, then every piece going down in the order you placed it, then your score.",
          "Friends can play the same setting straight from your link.",
        ],
      },
      {
        title: "Nicer to play",
        changes: [
          "Drag pieces onto the board as well as tapping them.",
          "When you have placed every piece of one kind that a real set has, it greys out in the tray and tells you why.",
          "Study a position for up to 60 seconds, up from 32.",
          "Turn board coordinates on or off right on the setup card.",
          "Leaderboard scores now show each player's rating at the time they played.",
        ],
      },
      {
        title: "Fairer positions",
        description:
          "Thanks to a player's bug report, we found a board that looked impossible. It was really being drawn upside down.",
        changes: [
          "Boards now always show rank 8 at the top, in every view.",
          "The game no longer deals checks that no real game could reach, such as a pawn giving check from its starting square.",
        ],
      },
      {
        title: "A new home, a new look, in every language",
        changes: [
          "The home page is now the Brain Lab. Take a quick calibration round right there, then watch two famous games broken down the way a strong player remembers them: Topalov against Shirov in 1998 and Kasparov's Immortal from 1999.",
          "Every page has a clean, light design that is easier to read, and it is the same in all 24 languages.",
          "Pages load without jumping around, including in Russian, Vietnamese and Hindi.",
        ],
      },
      {
        title: "Learn, rebuilt",
        changes: [
          {
            segments: [
              "All 14 ",
              { text: "Learn", href: "/learn" },
              " guides were rewritten, with boards where they help, and arranged into a five-stage path from your first round to a daily habit.",
            ],
          },
          "Type a question such as \"why do I keep hanging pieces\" and Learn finds the guide that answers it.",
        ],
      },
      {
        title: "Smaller things you might notice",
        changes: [
          "This changelog has a list of releases on the side, so you can jump between updates.",
          "The contact form explains clearly what went wrong if a message cannot be sent.",
          "A page that does not exist now says so and points you back to a round.",
        ],
        note: "Thank you to everyone who wrote in, reported a bug or simply kept playing. Many of these changes started as one sentence in the feedback box.",
      },
    ],
  },
  {
    version: "1.2.5",
    publishedAt: "2026-10-05T14:40:00.000+08:00",
    title: "New: articles about the people behind chess memory",
    summary:
      "A new Articles section opens with three profiles: Magnus Carlsen, Adriaan de Groot and Judit Polgár. Each one tells a memory feat, sets it beside the research that explains it, and ends with a drill you can play.",
    groups: [
      {
        title: "Three articles to start",
        changes: [
          {
            segments: [
              { text: "Articles", href: "/articles" },
              " sits between Learn and Leaderboard in the menu.",
            ],
          },
          {
            segments: [
              {
                text: "How Magnus Carlsen names a famous game from one position",
                href: "/articles/magnus-carlsen",
              },
            ],
          },
          {
            segments: [
              {
                text: "Adriaan de Groot's 1944 test of chess memory, by the numbers",
                href: "/articles/adriaan-de-groot",
              },
            ],
          },
          {
            segments: [
              {
                text: "How Judit Polgár played blindfold chess at age seven",
                href: "/articles/judit-polgar",
              },
            ],
          },
          "Every article has a portrait, a fact file, the sources it draws on, and a drill that opens a round sized to the story.",
          "After every round, the result screen suggests one article and sets its drill beside the round you just played.",
          "The articles can be read in every language the game supports. The other languages are translated from English with AI assistance.",
        ],
        note: "The articles are researched and drafted with AI assistance, then checked against their sources before they go up. If you spot a mistake, please tell us through the contact page.",
      },
      {
        title: "Made to be read",
        changes: [
          "Open an article from the list and its portrait moves into place while the text types in. Press Show all text to skip the typing.",
          "Arrive from a search engine, or refresh the page, and the whole article is there at once.",
          "If your device asks for reduced motion, the movement and the typing are skipped.",
        ],
      },
      {
        title: "Views and likes",
        changes: [
          "Each article shows how many times it has been viewed and liked.",
          "Like an article with one tap. Your like is remembered in your browser, with no account.",
          "Sort the list by newest, most viewed or most liked.",
          {
            segments: [
              "No visitor identifier is stored. The ",
              { text: "privacy page", href: "/privacy" },
              " says exactly what is kept.",
            ],
          },
        ],
      },
    ],
  },
  {
    version: "1.2.4",
    publishedAt: "2026-09-19T10:00:00.000+08:00",
    title: "You asked the game to remember. Thank you.",
    summary:
      "A note in the feedback box asked the game to keep your last settings instead of resetting every time. It now does, for presets and for your own mixes, and the pages you load most paint noticeably faster on phones.",
    groups: [
      {
        title: "Your last settings, remembered",
        description:
          "One of you wrote: \"When clicking 'New game' the view should keep the last settings we played with.\" Fair point, and thank you for writing it down. Every new game used to snap back to Medium, whatever you had just played.",
        changes: [
          "New game now opens on the pieces and look time you last played, whether that was a preset like Hard or your own mix, such as 3 pieces with 18 seconds to look.",
          "Your settings stay put after a reload, in a new tab, and the next time you visit, on the same browser.",
          "A link that names a level or a drill, like the buttons in the guides, still opens exactly that setup.",
        ],
        note: "Keep the suggestions coming. This one took a single sentence in the feedback box to set off.",
      },
      {
        title: "A simpler settings page",
        changes: [
          "The Difficulty and time controls on the settings page never changed the game. They are gone, because the game screen is where you choose, and it now remembers. Board coordinates stay on the settings page.",
        ],
      },
      {
        title: "Faster on phones",
        changes: [
          "On a typical phone the home page and the game now paint their main text in about 1.4 to 1.5 seconds, down from up to 3.8. The game screen arrives ready instead of waiting for scripts, and pages no longer download fonts they never use.",
        ],
      },
      {
        title: "Fly your flag on the leaderboard",
        description:
          "A score used to be a name and a number. Now it can say where you played from, if you want it to.",
        changes: [
          "Pick a country when you submit a score, and its flag sits beside your name on the board.",
          "The globe is the default, because not everyone wants to say where they are. Leave it alone and it stays a globe.",
          "Start typing to find a country instead of scrolling the whole list.",
          "Your choice is remembered for next time, the same way your game settings are.",
          "Every score already on the board keeps the globe. Nothing was guessed on your behalf.",
        ],
      },
      {
        title: "We now say when a score is worth submitting",
        changes: [
          "Finish a round and the result screen tells you, in one line, whether that score reaches the leaderboard.",
          "It compares against the lowest score actually on that board, so it is an answer rather than encouragement. On the quieter boards there is still room, and it says so.",
          "The line appears only when the answer is yes, and it leaves once you have submitted.",
        ],
      },
    ],
  },
  {
    version: "1.2.3",
    publishedAt: "2026-08-28T12:00:00.000+08:00",
    title: "You found the knight bug. Thank you.",
    summary:
      "Two notes left in the feedback box turned out to be real bugs: one had been quietly marking correct answers wrong, the other was eating pieces when you placed them quickly. Both are fixed, and the board is steadier and quicker while we were in there.",
    groups: [
      {
        title: "The knight that was scored as a king",
        description:
          "One of you wrote: \"The system doesn't see the placed knight and shows that it has been missed.\" You were exactly right, and it was worse than it looked.",
        changes: [
          "Every knight you placed was recorded as a king, so a knight on the right square was marked wrong. Rebuild a six-piece position perfectly with one knight in it and you scored 67%.",
          "It could take a second piece down with it. Once a knight had claimed a square as a king, the next king or knight of that colour silently failed to appear at all.",
          "Knights are knights again. A perfect rebuild scores 100%, as it always should have.",
        ],
        note: "If your scores looked stingy, they were. Sorry about that.",
      },
      {
        title: "Pieces that vanished when you played fast",
        description:
          "Another note: \"the pieces I put on the board originally isn't exactly the submitted position board... especially if I put some pieces fast.\" Also exactly right.",
        changes: [
          "A hidden timer was throttling taps, and when they came close together it threw the earlier ones away. Tap eight squares quickly and four of them never happened.",
          "Every tap now lands, however fast you go.",
          "Removing a piece straight after placing it works too. That used to be ignored for half a second.",
        ],
      },
      {
        title: "A board that stays put",
        changes: [
          "The board no longer jumps or slides when the timer runs out and it is your turn to place. It stays exactly where it was.",
          "Memorising and placing no longer scroll. The board is sized to the screen you actually have, so there is nothing to scroll to.",
          "On a phone the board is bigger and sits 4px from the edge instead of 15px, so the squares are easier to hit. The timer and the piece tray now line up with the board's edges instead of drifting wider than it.",
        ],
      },
      {
        title: "Quicker under the finger",
        changes: [
          "Every tap used to wait 50 milliseconds before anything happened, whether you were rushing or not. That pause is gone.",
          "The board also redraws less. Keeping track of a tap no longer re-renders all 64 squares, and the selected square's highlight animates only the two properties that actually change.",
          "The ring marking the square you tapped is now drawn on all four sides. It always had been on two.",
        ],
      },
      {
        title: "Housekeeping",
        changes: [
          "The board used to be told how big to be, worked out from a hand-written guess at how much room everything else needed. Five copies of that guess had to agree with each other, and they drifted apart, which is how a good deal of the above went unnoticed. The board now measures the space it has, and the guess is gone along with 73 lines of code.",
          "One stray English line on the memorise screen had escaped the 24-language release. It now counts your pieces in all of them, in the right plural.",
        ],
        note: "Both of the bugs above came from the feedback box after a game. If something feels off, tell us — it is by far the fastest way to get it fixed.",
      },
    ],
  },
  {
    version: "1.2.2",
    publishedAt: "2026-08-27T12:00:00.000+08:00",
    title: "Memory Chess now speaks your language",
    summary:
      "The game and every Learn guide are now available in 24 languages, and the site starts in yours.",
    groups: [
      {
        title: "24 languages",
        changes: [
          "Memory Chess is now available in 24 languages: English, Spanish, Russian, Brazilian Portuguese, German, French, Hindi, Italian, Simplified Chinese, Turkish, Swedish, Dutch, Polish, Indonesian, Norwegian, Finnish, Romanian, Vietnamese, Czech, Japanese, Korean, Traditional Chinese, Danish, and Hungarian.",
          "Everything you read while playing is translated, from the home page and settings to the timer, the results screen, the leaderboard, and this changelog.",
        ],
        note: "As of September 2026, this changelog is back to English only. The game itself still plays in all 24 languages.",
      },
      {
        title: "All 16 Learn guides, in every language",
        changes: [
          {
            segments: [
              "Every guide in ",
              {
                text: "Learn",
                href: "/learn",
              },
              " has been translated in full. The practice steps, the drills, the weekly plan, and the questions at the end all read naturally in your language, with chess terms that match how players actually speak it.",
            ],
          },
        ],
        note: "As of September 2026, the Learn guides are in English only, and two of them have been merged into others. Chess board vision drills is now part of How to stop blundering in chess, and Working memory exercises for chess is now part of Chess calculation exercises for beginners. The game itself still plays in all 24 languages.",
      },
      {
        title: "Switch language whenever you like",
        changes: [
          "A globe at the top of every page opens the language list. Each language is written in its own name, so you can find yours without reading English first.",
          "Choosing a language keeps you exactly where you were, and Memory Chess remembers your choice the next time you visit.",
        ],
      },
      {
        title: "We try to get it right before you ask",
        changes: [
          "New visitors now start in the language their browser or region suggests, whenever we have it. If the guess is wrong, the globe is right there to fix it.",
        ],
      },
    ],
  },
  {
    version: "1.2.1",
    publishedAt: "2026-08-16T12:00:00.000+08:00",
    title: "Smoother games, clearer results",
    summary:
      "Your board stays steady, random positions make more sense, and results are easier to review.",
    groups: [
      {
        title: "Steadier gameplay",
        changes: [
          "Thanks to helpful player feedback, the board now stays in the same place when memorization ends and placement begins. The controls and piece picker line up with the board too.",
          "Page headers, sound controls, and spacing now stay more consistent as you move through the game. Board pieces and labels can no longer be selected by accident.",
        ],
      },
      {
        title: "Better random positions",
        changes: [
          "Thanks to a player who reported this on Reddit, random positions no longer place kings beside each other, two bishops for one side on the same square color, pawns on the first or eighth rank, or both kings in check.",
        ],
      },
      {
        title: "Clearer results",
        changes: [
          "After each game, you can now compare the position you memorized with the board you submitted. Clear markers show correct, incorrect, and missed pieces.",
          "Your accuracy and the main replay and leaderboard actions now stay together at the top of the results. Missed pieces use a clear black dotted outline while the board remains visible underneath.",
        ],
      },
      {
        title: "A clearer finish",
        changes: [
          "When you submit, the timer stops for one second so you can see your locked-in time and final board before the results appear. A quick GAME! flash marks the end of the round, and the placement timer now shows milliseconds.",
        ],
      },
      {
        title: "Some statistics for everyone!",
        description:
          "Here is a snapshot of public leaderboard submissions through August 16, 2026.",
        tables: [
          {
            caption: "Accuracy",
            columns: ["Leaderboard submissions", "Through 2025", "2026"],
            rows: [
              {
                label: "Average accuracy",
                values: ["72.3%", "89.1%"],
              },
              {
                label: "Perfect-score rate",
                values: ["56.4%", "77.3%"],
              },
              {
                label: "Medium average accuracy",
                values: ["65.6%", "75.7%"],
              },
              {
                label: "Medium perfect-score rate",
                values: ["35.4%", "52.5%"],
              },
              {
                label: "Hard average accuracy",
                values: ["50.0%", "72.9%"],
              },
              {
                label: "Grandmaster average accuracy",
                values: ["21.7%", "52.3%"],
              },
            ],
          },
          {
            caption: "Submission speed",
            columns: ["Perfect-score solution time", "Through 2025", "2026"],
            rows: [
              {
                label: "All difficulties, median",
                values: ["5.42s", "5.42s"],
              },
              {
                label: "Easy, median",
                values: ["4.86s", "4.85s"],
              },
              {
                label: "Medium, median",
                values: ["15.88s", "17.60s"],
              },
            ],
          },
        ],
        note: "Among 50 repeated player-name and difficulty combinations, 33 had a faster latest solution and 17 had a slower one. Accuracy improved strongly overall, but taking more time can also lead to a better score. These figures cover voluntary leaderboard submissions, not every game, and the Easy leaderboard is limited to its top 200 entries.",
      },
      {
        title: "Thank you for playing",
        changes: [
          {
            segments: [
              "A huge thank you to everyone who helped Memory Chess reach more than 800 monthly players and over 32,000 games played. We are especially grateful to everyone who shared ideas, encouragement, and bug reports through the ",
              {
                text: "Contact us page",
                href: "/contact-us",
              },
              " or the end-of-game feedback form. Every game and message helps Memory Chess keep growing.",
            ],
          },
        ],
      },
    ],
  },
  {
    version: "1.2.0",
    publishedAt: "2026-08-15T00:00:00.000+08:00",
    title: "Learn more. Play smoother.",
    summary:
      "New guides, a clearer home page, quieter sounds, and an easy way to share feedback.",
    groups: [
      {
        title: "Learn and improve",
        changes: [
          "Explore new, easy-to-follow guides for chess memory and visualization.",
          "The refreshed home page now explains how Memory Chess trains your spatial memory.",
        ],
      },
      {
        title: "Everyday improvements",
        changes: [
          "Mobile play, piece setups, and leaderboard rankings are more reliable.",
          "Game sounds now start at a gentler 10% volume.",
        ],
      },
      {
        title: "Feedback and updates",
        changes: [
          "You can now rate the game after you play and see new releases in the changelog. The feedback prompt appears at most once a day.",
          "A new privacy page explains saved settings, analytics, feedback, and future ads in simple language.",
        ],
      },
    ],
  },
  {
    version: "1.1.0",
    publishedAt: "2025-04-04T00:00:00.000+08:00",
    title: "Picking pieces feels better",
    summary: "Choosing white or black pieces is now clearer and easier.",
    groups: [
      {
        title: "Piece selection",
        changes: [
          "The color picker has a fresh new look.",
          "It is easier to see which color you picked.",
          "Buttons now feel smoother and more consistent.",
        ],
      },
    ],
  },
  {
    version: "1.0.1",
    publishedAt: "2025-04-03T00:00:00.000+08:00",
    title: "Better on phones",
    summary:
      "Memory Chess is now easier and more comfortable to play on a small screen.",
    groups: [
      {
        title: "Mobile play",
        changes: [
          "The game, timer, and Skip button fit small screens better.",
          "Taps and spacing feel better on mobile.",
          "Sounds behave better as you move through the game.",
        ],
      },
    ],
  },
  {
    version: "1.0.0",
    publishedAt: "2025-03-28T00:00:00.000+08:00",
    title: "Let the memory games begin!",
    summary: "The first version of Memory Chess is ready to play.",
    groups: [
      {
        title: "The first release",
        changes: [
          "Memorize a chess position, then rebuild it from memory.",
          "Pick your difficulty, number of pieces, time, and board labels.",
          "See your score and time after every game.",
        ],
      },
    ],
  },
] as const;

export const LATEST_CHANGELOG_ENTRY = CHANGELOG_ENTRIES[0];

export function getChangelogEntryId(version: string): string {
  return `v${version.replaceAll(".", "-")}`;
}

export function isChangelogAnnouncementActive(
  entry: ChangelogEntry,
  now: Date = new Date(),
): boolean {
  const publishedAt = Date.parse(entry.publishedAt);

  if (Number.isNaN(publishedAt)) {
    return false;
  }

  const currentTime = now.getTime();
  return (
    currentTime >= publishedAt &&
    currentTime < publishedAt + CHANGELOG_ANNOUNCEMENT_DURATION_MS
  );
}
