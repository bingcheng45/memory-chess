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

const KNOWN_ROUTES = [
  "/articles",
  "/privacy",
  "/learn",
  "/leaderboard",
  "/game",
  "/about",
  "/contact-us",
  "/changelog",
  "/terms",
  "/settings",
];

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

  it("points every changelog link at a page that exists", () => {
    const hrefs = CHANGELOG_ENTRIES.flatMap((entry) => entry.groups)
      .flatMap((group) => group.changes ?? [])
      .flatMap((change) => (typeof change === "string" ? [] : change.segments))
      .flatMap((segment) => (typeof segment === "string" ? [] : [segment.href]))
      .filter((href) => href.startsWith("/"));

    const unknown = hrefs.filter((href) => {
      if (href.startsWith("/articles/")) {
        return !ARTICLE_SLUGS.includes(href.slice("/articles/".length));
      }
      return !(
        KNOWN_ROUTES.includes(href) ||
        href.startsWith("/learn/") ||
        href.startsWith("/game?")
      );
    });

    expect(hrefs.length).toBeGreaterThan(0);
    expect(unknown).toEqual([]);
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
