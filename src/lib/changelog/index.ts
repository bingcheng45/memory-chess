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
                text: "Contact Us page",
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
