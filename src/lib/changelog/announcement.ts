export const CHANGELOG_ANNOUNCEMENT_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
export const CHANGELOG_DISMISSAL_STORAGE_KEY =
  "memory-chess-dismissed-changelog-version";

export function isAnnouncementActive(
  publishedAt: string,
  now: Date = new Date(),
): boolean {
  const published = Date.parse(publishedAt);

  if (Number.isNaN(published)) {
    return false;
  }

  const currentTime = now.getTime();
  return (
    currentTime >= published &&
    currentTime < published + CHANGELOG_ANNOUNCEMENT_DURATION_MS
  );
}
