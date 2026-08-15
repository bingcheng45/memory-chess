import packageJson from "../../../package.json";
import packageLock from "../../../package-lock.json";
import {
  CHANGELOG_ANNOUNCEMENT_DURATION_MS,
  CHANGELOG_ENTRIES,
  LATEST_CHANGELOG_ENTRY,
  getChangelogEntryId,
  isChangelogAnnouncementActive,
} from "@/lib/changelog";

describe("changelog data", () => {
  it("keeps release history newest-first", () => {
    const releaseTimes = CHANGELOG_ENTRIES.map((entry) =>
      Date.parse(entry.publishedAt),
    );

    expect(releaseTimes).toEqual([...releaseTimes].sort((a, b) => b - a));
    expect(CHANGELOG_ENTRIES.map((entry) => entry.version)).toEqual([
      "1.2.0",
      "1.1.0",
      "1.0.1",
      "1.0.0",
    ]);
  });

  it("keeps package metadata aligned with the latest changelog entry", () => {
    expect(packageJson.version).toBe(LATEST_CHANGELOG_ENTRY.version);
    expect(packageLock.version).toBe(LATEST_CHANGELOG_ENTRY.version);
    expect(packageLock.packages[""].version).toBe(
      LATEST_CHANGELOG_ENTRY.version,
    );
  });

  it("uses stable version anchors", () => {
    expect(getChangelogEntryId("1.2.0")).toBe("v1-2-0");
  });

  it("keeps an announcement active for exactly 30 days", () => {
    const publishedAt = Date.parse(LATEST_CHANGELOG_ENTRY.publishedAt);

    expect(
      isChangelogAnnouncementActive(
        LATEST_CHANGELOG_ENTRY,
        new Date(publishedAt),
      ),
    ).toBe(true);
    expect(
      isChangelogAnnouncementActive(
        LATEST_CHANGELOG_ENTRY,
        new Date(publishedAt + CHANGELOG_ANNOUNCEMENT_DURATION_MS - 1),
      ),
    ).toBe(true);
    expect(
      isChangelogAnnouncementActive(
        LATEST_CHANGELOG_ENTRY,
        new Date(publishedAt + CHANGELOG_ANNOUNCEMENT_DURATION_MS),
      ),
    ).toBe(false);
  });
});
