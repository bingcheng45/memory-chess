import { splitClientMessages, tileGroupOf } from "@/lib/articles/messageScope";

describe("splitClientMessages", () => {
  it("parts the articles namespace, the dashboard, the daily page, the home lab group and the lab, dashboard and daily groups /game prints, with the claim dialog's name messages, from every other string", () => {
    const catalogue = {
      common: { nav: { articles: "Articles" } },
      articles: { like: { button: "Recommend this article" } },
      home: {
        meta: { title: "Memory Chess" },
        lab: { hero: { lede: "Put a number on it." }, resultCard: { title: "Your lab record" }, daily: { locked: "One try per day." }, review: { none: "Nothing due." } },
      },
      game: { skip: "Skip" },
      dashboard: { title: "Your progress", label: { span: "Memory span" }, unit: { rating: "<n>{value}</n>" }, deltas: { new: "New" } },
      daily: { meta: { title: "Daily board" }, round: { locked: "You have played today's board." }, join: { name: "Name", nameShort: "Too short." }, reference: { title: "How it works" } },
    };

    expect(splitClientMessages(catalogue)).toEqual({
      shared: { common: { nav: { articles: "Articles" } }, home: { meta: { title: "Memory Chess" } }, game: { skip: "Skip" } },
      articles: { like: { button: "Recommend this article" } },
      lab: { home: { lab: { hero: { lede: "Put a number on it." }, daily: { locked: "One try per day." }, review: { none: "Nothing due." } } } },
      game: {
        home: { lab: { resultCard: { title: "Your lab record" }, daily: { locked: "One try per day." }, review: { none: "Nothing due." } } },
        dashboard: { label: { span: "Memory span" }, unit: { rating: "<n>{value}</n>" }, deltas: { new: "New" } },
        daily: { round: { locked: "You have played today's board." }, join: { nameShort: "Too short." } },
      },
      dashboard: { dashboard: { title: "Your progress", label: { span: "Memory span" }, unit: { rating: "<n>{value}</n>" }, deltas: { new: "New" } } },
      daily: { daily: { round: { locked: "You have played today's board." }, join: { name: "Name", nameShort: "Too short." } } },
    });
  });

  it("sends no client the recall data page's strings, which only server components print", () => {
    const { shared } = splitClientMessages({ common: { nav: { about: "About" } }, data: { title: "How well do people remember chess positions?" } });

    expect(shared).toEqual({ common: { nav: { about: "About" } }, home: {} });
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
      daily: {},
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
