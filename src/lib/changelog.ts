export const CHANGELOG_ANNOUNCEMENT_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
export const CHANGELOG_DISMISSAL_STORAGE_KEY =
  "memory-chess-dismissed-changelog-version";

export interface ChangelogEntry {
  version: string;
  publishedAt: string;
  title: string;
  summary: string;
  changes: readonly string[];
}

export const CHANGELOG_ENTRIES: readonly ChangelogEntry[] = [
  {
    version: "1.2.0",
    publishedAt: "2026-08-16T00:00:00.000+08:00",
    title: "Learn more. Play smoother.",
    summary:
      "New guides, a clearer home page, quieter sounds, and an easy way to share feedback.",
    changes: [
      "Learn with new, easy-to-follow chess memory guides.",
      "The home page now shows how Memory Chess trains your brain.",
      "Mobile play, piece setups, and leaderboard results are more reliable.",
      "Game sounds now start at a gentle 10% volume.",
      "Rate the game and share ideas after you play. We ask at most once a day.",
      "See every update here, and use the top banner to spot what is new.",
      "Read a simple privacy page about saved settings, analytics, feedback, and future ads.",
    ],
  },
  {
    version: "1.1.0",
    publishedAt: "2025-04-04T00:00:00.000+08:00",
    title: "Picking pieces feels better",
    summary: "Choosing white or black pieces is now clearer and easier.",
    changes: [
      "The color picker has a fresh new look.",
      "It is easier to see which color you picked.",
      "Buttons now feel smoother and more consistent.",
    ],
  },
  {
    version: "1.0.1",
    publishedAt: "2025-04-03T00:00:00.000+08:00",
    title: "Better on phones",
    summary:
      "Memory Chess is now easier and more comfortable to play on a small screen.",
    changes: [
      "The game, timer, and Skip button fit small screens better.",
      "Taps and spacing feel better on mobile.",
      "Sounds behave better as you move through the game.",
    ],
  },
  {
    version: "1.0.0",
    publishedAt: "2025-03-28T00:00:00.000+08:00",
    title: "Let the memory games begin!",
    summary: "The first version of Memory Chess is ready to play.",
    changes: [
      "Memorize a chess position, then rebuild it from memory.",
      "Pick your difficulty, number of pieces, time, and board labels.",
      "See your score and time after every game.",
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
