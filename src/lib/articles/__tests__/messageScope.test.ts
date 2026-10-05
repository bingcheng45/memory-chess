import { splitArticlesNamespace, tileGroupOf } from "@/lib/articles/messageScope";

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

describe("tileGroupOf", () => {
  it("keeps the tile's strings and drops the rest of the articles namespace", () => {
    const catalogue = {
      articles: { like: { button: "Artikel empfehlen" }, tile: { eyebrow: "Als Nächstes lesen", read: "Artikel lesen" } },
      game: { skip: "Überspringen" },
    };

    expect(tileGroupOf(catalogue)).toEqual({ tile: { eyebrow: "Als Nächstes lesen", read: "Artikel lesen" } });
  });

  it("refuses a catalogue with no articles namespace instead of sending a page its raw keys", () => {
    expect(() => tileGroupOf({ game: { skip: "Skip" } })).toThrow("The catalogue has no articles namespace");
  });
});
