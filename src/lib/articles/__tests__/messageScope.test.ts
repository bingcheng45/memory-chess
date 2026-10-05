import { splitArticlesNamespace } from "@/lib/articles/messageScope";

describe("splitArticlesNamespace", () => {
  it("parts the articles namespace from every other one", () => {
    const catalogue = {
      common: { nav: { articles: "Artikel" } },
      articles: { like: { button: "Artikel empfehlen" } },
      game: { skip: "Überspringen" },
    };

    expect(splitArticlesNamespace(catalogue)).toEqual({
      shared: { common: { nav: { articles: "Artikel" } }, game: { skip: "Überspringen" } },
      articles: { like: { button: "Artikel empfehlen" } },
    });
  });
});
