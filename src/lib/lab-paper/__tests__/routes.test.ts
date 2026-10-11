import { isLabPaperRoute, type LabPaperRoute } from "@/lib/lab-paper/routes";

describe("the Lab Paper route registry", () => {
  it("draws the homepage in Lab Paper only in the locales that have its copy, and leaves unlisted routes in the site shell", () => {
    expect(isLabPaperRoute("/", "en")).toBe(true);
    expect(isLabPaperRoute("/", "de")).toBe(false);
    expect(isLabPaperRoute("/privacy", "en")).toBe(false);
    expect(isLabPaperRoute("/contact-us", "de")).toBe(false);
  });

  it("draws the English-only changelog and about pages in Lab Paper", () => {
    expect(isLabPaperRoute("/changelog", "en")).toBe(true);
    expect(isLabPaperRoute("/about", "en")).toBe(true);
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
