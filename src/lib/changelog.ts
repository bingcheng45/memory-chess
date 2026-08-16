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
  changes: readonly string[];
}

export const CHANGELOG_ENTRIES: readonly ChangelogEntry[] = [
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
