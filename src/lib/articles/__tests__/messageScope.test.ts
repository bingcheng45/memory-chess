import { splitClientMessages, tileGroupOf } from "@/lib/articles/messageScope";

describe("splitClientMessages", () => {
  it("parts the articles namespace, the home lab group and the lab groups /game prints from every other string", () => {
    const catalogue = {
      common: { nav: { articles: "Articles" } },
      articles: { like: { button: "Recommend this article" } },
      home: {
        meta: { title: "Memory Chess" },
        lab: { hero: { lede: "Put a number on it." }, resultCard: { title: "Your lab record" }, daily: { locked: "One try per day." }, review: { none: "Nothing due." } },
      },
      game: { skip: "Skip" },
    };

    expect(splitClientMessages(catalogue)).toEqual({
      shared: { common: { nav: { articles: "Articles" } }, home: { meta: { title: "Memory Chess" } }, game: { skip: "Skip" } },
      articles: { like: { button: "Recommend this article" } },
      lab: { home: { lab: { hero: { lede: "Put a number on it." }, daily: { locked: "One try per day." }, review: { none: "Nothing due." } } } },
      game: { home: { lab: { resultCard: { title: "Your lab record" }, daily: { locked: "One try per day." }, review: { none: "Nothing due." } } } },
    });
  });

  it("adds no lab group for a catalogue without the lab", () => {
    const catalogue = { home: { meta: { title: "Memory Chess" } }, game: { skip: "Überspringen" } };

    expect(splitClientMessages(catalogue)).toEqual({
      shared: { home: { meta: { title: "Memory Chess" } }, game: { skip: "Überspringen" } },
      articles: undefined,
      lab: {},
      game: {},
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

  it("refuses a catalogue with no tile strings instead of sending a page its raw keys", () => {
    expect(() => tileGroupOf({ game: { skip: "Skip" } })).toThrow("The catalogue has no articles.tile group");
    expect(() => tileGroupOf({ articles: { like: { button: "Like this article" } } })).toThrow(
      "The catalogue has no articles.tile group",
    );
  });
});
