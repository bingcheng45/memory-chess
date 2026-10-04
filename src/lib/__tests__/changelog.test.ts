import packageJson from "../../../package.json";
import packageLock from "../../../package-lock.json";
import {
  CHANGELOG_ANNOUNCEMENT_DURATION_MS,
  CHANGELOG_ENTRIES,
  LATEST_CHANGELOG_ENTRY,
  getChangelogEntryId,
  isChangelogAnnouncementActive,
} from "@/lib/changelog";
import { ARTICLE_SLUGS } from "@/lib/articles";

describe("changelog data", () => {
  it("keeps release history newest-first", () => {
    const releaseTimes = CHANGELOG_ENTRIES.map((entry) =>
      Date.parse(entry.publishedAt),
    );

    expect(releaseTimes).toEqual([...releaseTimes].sort((a, b) => b - a));
    const versions = CHANGELOG_ENTRIES.map((entry) => entry.version);
    const byVersionDescending = (a: string, b: string) =>
      b.localeCompare(a, undefined, { numeric: true });
    expect(versions).toEqual([...versions].sort(byVersionDescending));
  });

  it("keeps package metadata aligned with the latest changelog entry", () => {
    expect(packageJson.version).toBe(LATEST_CHANGELOG_ENTRY.version);
    expect(packageLock.version).toBe(LATEST_CHANGELOG_ENTRY.version);
    expect(packageLock.packages[""].version).toBe(
      LATEST_CHANGELOG_ENTRY.version,
    );
  });

  it("links the articles release to every published article", () => {
    const release = CHANGELOG_ENTRIES.find(
      (entry) => entry.version === "1.2.5",
    );
    const hrefs = (release?.groups ?? [])
      .flatMap((group) => group.changes ?? [])
      .flatMap((change) => (typeof change === "string" ? [] : change.segments))
      .flatMap((segment) =>
        typeof segment === "string" ? [] : [segment.href],
      );

    expect(
      hrefs.filter((href) => href.startsWith("/articles/")).sort(),
    ).toEqual(ARTICLE_SLUGS.map((slug) => `/articles/${slug}`).sort());
    expect(hrefs).toContain("/articles");
    expect(hrefs).toContain("/privacy");
  });

  it("uses stable version anchors", () => {
    expect(getChangelogEntryId("1.2.2")).toBe("v1-2-2");
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
