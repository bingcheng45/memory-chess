import { isLabPaperRoute, type LabPaperRoute } from "@/lib/lab-paper/routes";

describe("the Lab Paper route registry", () => {
  it("draws the homepage in Lab Paper in every locale, and leaves unlisted routes in the site shell", () => {
    expect(isLabPaperRoute("/", "en")).toBe(true);
    expect(isLabPaperRoute("/", "de")).toBe(true);
    expect(isLabPaperRoute("/", "ja")).toBe(true);
    expect(isLabPaperRoute("/settings", "en")).toBe(false);
    expect(isLabPaperRoute("/settings", "de")).toBe(false);
  });

  it("draws the English-only changelog, about, terms and privacy pages in Lab Paper", () => {
    expect(isLabPaperRoute("/changelog", "en")).toBe(true);
    expect(isLabPaperRoute("/about", "en")).toBe(true);
    expect(isLabPaperRoute("/terms", "en")).toBe(true);
    expect(isLabPaperRoute("/privacy", "en")).toBe(true);
  });

  it("draws the leaderboard and the contact page in Lab Paper in every locale, since every catalogue carries their copy", () => {
    expect(isLabPaperRoute("/leaderboard", "en")).toBe(true);
    expect(isLabPaperRoute("/leaderboard", "ja")).toBe(true);
    expect(isLabPaperRoute("/contact-us", "en")).toBe(true);
    expect(isLabPaperRoute("/contact-us", "de")).toBe(true);
  });

  it("draws both kinds of shared card page in Lab Paper at their bare English URL", () => {
    expect(isLabPaperRoute("/share/result/1_g_4_100_84_383", "en")).toBe(true);
    expect(isLabPaperRoute("/share/progress/1_s6_h52", "en")).toBe(true);
    expect(isLabPaperRoute("/share-old", "en")).toBe(false);
  });

  it("covers the paths beneath a subtree route, in the locales the route lists", () => {
    const routes: readonly LabPaperRoute[] = [
      { path: "/articles", scope: "subtree", locales: "all" },
      { path: "/about", scope: "page", locales: ["en"] },
    ];

    expect(isLabPaperRoute("/articles", "ja", routes)).toBe(true);
    expect(isLabPaperRoute("/articles/chunking", "de", routes)).toBe(true);
    expect(isLabPaperRoute("/articles-old", "en", routes)).toBe(false);
    expect(isLabPaperRoute("/about", "en", routes)).toBe(true);
    expect(isLabPaperRoute("/about/team", "en", routes)).toBe(false);
    expect(isLabPaperRoute("/about", "fr", routes)).toBe(false);
  });
});
