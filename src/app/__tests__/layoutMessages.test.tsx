import { localeLayoutClientMessages } from "@/test-utils/localeLayoutMessages";

jest.mock("next-intl/server", () => ({
  ...jest.requireActual("next-intl/server"),
  setRequestLocale: jest.fn(),
  getMessages: jest.fn(async ({ locale }: { locale: string }) => ({
    common: { nav: { articles: locale === "de" ? "Artikel" : "Articles" } },
    game: { skip: locale === "de" ? "Überspringen" : "Skip" },
    home: locale === "de" ? { meta: { title: "Gedächtnisschach" } } : { meta: { title: "Memory Chess" }, lab: { hero: { lede: "Put a number on it." } } },
    articles: { like: { button: locale === "de" ? "Artikel empfehlen" : "Recommend this article" } },
  })),
}));

describe("the messages the locale layout sends to every page", () => {
  it("are every namespace of the page's language but the articles and the home lab", async () => {
    expect(await localeLayoutClientMessages("de")).toEqual({
      common: { nav: { articles: "Artikel" } },
      game: { skip: "Überspringen" },
      home: { meta: { title: "Gedächtnisschach" } },
    });
    expect(await localeLayoutClientMessages("en")).toEqual({
      common: { nav: { articles: "Articles" } },
      game: { skip: "Skip" },
      home: { meta: { title: "Memory Chess" } },
    });
  });
});
