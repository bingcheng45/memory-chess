import { splitClientMessages, tileGroupOf } from "@/lib/articles/messageScope";

describe("splitClientMessages", () => {
  it("parts the articles namespace, the dashboard, the home lab group and the lab and dashboard groups /game prints from every other string", () => {
    const catalogue = {
      common: { nav: { articles: "Articles" } },
      articles: { like: { button: "Recommend this article" } },
      home: {
        meta: { title: "Memory Chess" },
        lab: { hero: { lede: "Put a number on it." }, resultCard: { title: "Your lab record" }, daily: { locked: "One try per day." }, review: { none: "Nothing due." } },
      },
      game: { skip: "Skip" },
      dashboard: { title: "Your progress", label: { span: "Memory span" }, unit: { rating: "<n>{value}</n>" }, deltas: { new: "New" } },
    };

    expect(splitClientMessages(catalogue)).toEqual({
      shared: { common: { nav: { articles: "Articles" } }, home: { meta: { title: "Memory Chess" } }, game: { skip: "Skip" } },
      articles: { like: { button: "Recommend this article" } },
      lab: { home: { lab: { hero: { lede: "Put a number on it." }, daily: { locked: "One try per day." }, review: { none: "Nothing due." } } } },
      game: {
        home: { lab: { resultCard: { title: "Your lab record" }, daily: { locked: "One try per day." }, review: { none: "Nothing due." } } },
        dashboard: { label: { span: "Memory span" }, unit: { rating: "<n>{value}</n>" }, deltas: { new: "New" } },
      },
      dashboard: { dashboard: { title: "Your progress", label: { span: "Memory span" }, unit: { rating: "<n>{value}</n>" }, deltas: { new: "New" } } },
    });
  });

  it("sends /game the dashboard figures' strings in a catalogue without the lab", () => {
    const catalogue = { game: { skip: "Überspringen" }, dashboard: { title: "Dashboard", label: { span: "Gedächtnisspanne" }, unit: { percent: "<n>{value}</n> %" }, deltas: { new: "Neu" } } };

    expect(splitClientMessages(catalogue).game).toEqual({ dashboard: { label: { span: "Gedächtnisspanne" }, unit: { percent: "<n>{value}</n> %" }, deltas: { new: "Neu" } } });
  });

  it("adds no lab group for a catalogue without the lab", () => {
    const catalogue = { home: { meta: { title: "Memory Chess" } }, game: { skip: "Überspringen" } };

    expect(splitClientMessages(catalogue)).toEqual({
      shared: { home: { meta: { title: "Memory Chess" } }, game: { skip: "Überspringen" } },
      articles: undefined,
      lab: {},
      game: {},
      dashboard: {},
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
