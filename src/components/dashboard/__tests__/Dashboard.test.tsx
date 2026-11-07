import { act, fireEvent, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { renderWithIntl, screen, within } from "@/test-utils/intl";
import messages from "../../../../messages/en.json";
import { Dashboard } from "@/components/dashboard/Dashboard";
import type { LabData } from "@/hooks/useLabData";
import { persona } from "@/test-utils/labPersona";
import type { PersonaName } from "@/lib/lab/personas";

// jsdom resolves the browser build, which needs MessageChannel.
jest.mock("react-dom/server", () => jest.requireActual("react-dom/server.node"));
jest.mock("@/lib/analytics/events", () => ({ ...jest.requireActual("@/lib/analytics/events"), trackEvent: jest.fn() }));
jest.mock("@/components/dashboard/shareImage", () => ({ drawShareCard: () => Promise.resolve(new Blob(["png"], { type: "image/png" })) }));

let labData: LabData;
jest.mock("@/hooks/useLabData", () => ({
  ...jest.requireActual("@/hooks/useLabData"),
  useLabData: () => labData,
}));

const show = (name: PersonaName) => {
  labData = persona(name);
  return renderWithIntl(<Dashboard />);
};
const tileText = (id: string) => document.querySelector(`[data-tile="${id}"]`)?.textContent;
const unlockText = (id: string) => document.querySelector(`[data-unlock="${id}"]`)?.textContent;
const historyRows = () => waitFor(() => {
  const rows = document.querySelectorAll<HTMLElement>("[data-history-row]");
  expect(rows.length).toBeGreaterThan(0);
  return [...rows];
});

const frames = (count: number) =>
  act(() => new Promise<void>((done) => {
    const step = (left: number) => (left === 0 ? done() : requestAnimationFrame(() => step(left - 1)));
    step(count);
  }));

beforeEach(() => window.localStorage.clear());

describe("Dashboard", () => {
  it("offers the share card once a headline figure is ready, with the caption it will post", async () => {
    URL.createObjectURL = jest.fn(() => "blob:card");
    URL.revokeObjectURL = jest.fn();
    show("threeDays");

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Share my progress" })));
    expect(within(screen.getByRole("dialog")).getByText(/^My Memory Chess progress/).textContent).toBe(
      "My Memory Chess progress: memory span 6 pieces, 5.3 pieces held, 4.6 s per piece, 100% best accuracy. Can you beat it? https://thememorychess.com/share/progress/1_s6_h53_v46_b100_a89_m13_t41_k3_n12_d3?utm_source=share&utm_medium=dashboard",
    );
    expect(tileText("span")).toBe("Memory span6 pieces80% or better in 11 rounds, studied 10 s");
    expect(tileText("studyTime")).toBe("Study time1.3 s per pieceAverage of your last 12 rounds, any setting");
    expect(tileText("rebuildTime")).toBe("Rebuild time4.1 s per pieceAverage of your last 12 rounds, any setting");
  });

  it("lists every round of the record, newest first, and opens a round's scored board", async () => {
    show("threeDays");

    const rows = await historyRows();
    expect(document.querySelector("[data-history-count]")?.textContent).toBe("Showing 12 of 12 rounds");
    expect(rows).toHaveLength(12);
    const first = within(rows[0] as HTMLElement);
    expect([...rows[0].querySelectorAll("td[data-label]")].map((cell) => `${cell.getAttribute("data-label")}: ${cell.textContent}`).slice(4, 7)).toEqual([
      "Correct: 5 of 6",
      "Study time: 10.0 s",
      "Rebuild time: 26.8 s",
    ]);
    fireEvent.click(first.getByRole("button", { name: "Show board" }));
    expect(first.getByRole("button", { name: "Hide board" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("figure", { name: /^Scored board: \d+ of \d+ pieces right\.$/ })).toBeInTheDocument();
  });

  it("keeps one round's board open at a time, and closes it from its own button", async () => {
    show("threeDays");

    const [first, second] = (await historyRows()).map((row) => within(row));
    fireEvent.click(first.getByRole("button", { name: "Show board" }));
    fireEvent.click(second.getByRole("button", { name: "Show board" }));
    expect(first.getByRole("button", { name: "Show board" })).toHaveAttribute("aria-expanded", "false");
    expect(second.getByRole("button", { name: "Hide board" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("figure", { name: /^Scored board:/ })).toHaveLength(1);

    fireEvent.click(second.getByRole("button", { name: "Hide board" }));
    expect(second.getByRole("button", { name: "Show board" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryAllByRole("figure", { name: /^Scored board:/ })).toHaveLength(0);
  });

  it("shows twenty rounds at first and twenty more on request, and filters by setting", async () => {
    show("thirtyDays");

    expect(await historyRows()).toHaveLength(20);
    expect(document.querySelector("[data-history-count]")?.textContent).toBe("Showing 20 of 90 rounds");
    fireEvent.click(screen.getByRole("button", { name: "Show 20 more" }));
    expect(document.querySelectorAll("[data-history-row]")).toHaveLength(40);

    const setting = screen.getByRole("combobox", { name: "Setting" });
    fireEvent.change(setting, { target: { value: (within(setting).getAllByRole("option")[1] as HTMLOptionElement).value } });
    const shown = document.querySelector("[data-history-count]")?.textContent ?? "";
    expect(shown).toMatch(/^Showing \d+ of \d+ rounds?$/);
    expect(shown).not.toBe("Showing 20 of 90 rounds");
  });

  it("explains an empty record and offers a first round instead of an empty table", async () => {
    show("newVisitor");

    expect(await screen.findByText("No rounds yet.")).toBeInTheDocument();
    expect(document.querySelectorAll("[data-history-row]")).toHaveLength(0);
  });

  it("swaps the share button for a first round before any round is played", () => {
    show("newVisitor");

    expect(screen.queryByRole("button", { name: "Share my progress" })).toBeNull();
    expect(screen.getByText("After your first round, your card shows your best figures here.")).toBeInTheDocument();
  });

  it("shares the figures that are ready while the headline figures still warm", async () => {
    URL.createObjectURL = jest.fn(() => "blob:card");
    URL.revokeObjectURL = jest.fn();
    show("twoRounds");

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Share my progress" })));
    expect(within(screen.getByRole("dialog")).getByText(/^My Memory Chess progress/).textContent).toBe(
      "My Memory Chess progress: 83% best accuracy, 67% recent accuracy, study time 1.1 s per piece, rebuild time 4.8 s per piece. Can you beat it? https://thememorychess.com/share/progress/1_b83_a67_m11_t48_n2_d1?utm_source=share&utm_medium=dashboard",
    );
  });

  describe.each<PersonaName>(["newVisitor", "twoRounds", "threeDays", "thirtyDays"])("for the %s persona", (name) => {
    beforeEach(() => {
      URL.createObjectURL = jest.fn(() => "blob:card");
      URL.revokeObjectURL = jest.fn();
    });
    afterEach(() => window.history.replaceState(null, "", "/"));

    it.each([
      ["span", "Memory span"],
      ["recentAccuracy", "Recent accuracy"],
      ["days", "Days played"],
    ])("draws the tile-%s fragment a Learn link opens, labelled %s", (id, label) => {
      window.history.replaceState(null, "", `/dashboard#tile-${id}`);
      show(name);

      expect(document.getElementById(`tile-${id}`)?.textContent?.startsWith(label)).toBe(true);
    });
  });

  describe("a Learn link's fragment that the first paint could not draw", () => {
    const original = Element.prototype.scrollIntoView;
    let scrolled: { id: string; historyRows: number; analysis: boolean }[];
    beforeEach(() => {
      URL.createObjectURL = jest.fn(() => "blob:card");
      URL.revokeObjectURL = jest.fn();
      scrolled = [];
      Element.prototype.scrollIntoView = function (this: Element) {
        scrolled.push({
          id: this.id,
          historyRows: document.querySelectorAll("[data-history-row]").length,
          analysis: document.querySelector("#analysis .lab-dash-panels:not(.lab-dash-pending)") !== null,
        });
      };
      window.history.replaceState(null, "", "/dashboard#tile-days");
    });
    afterEach(() => {
      Element.prototype.scrollIntoView = original;
      window.history.replaceState(null, "", "/");
    });

    it.each([
      ["nothing", () => undefined, [{ id: "tile-days", historyRows: 20, analysis: true }]],
      ["a wheel turn", () => fireEvent.wheel(window), []],
      ["a key press", () => fireEvent.keyDown(window, { key: "PageDown" }), []],
      ["a touch", () => fireEvent.touchStart(window), []],
    ])("after %s from the player while the record loads, is scrolled to once the sections below it are in place only if there was no input", async (_, input, expected) => {
      labData = { ...persona("thirtyDays"), storage: "loading", records: [], today: "" };
      const { rerender } = renderWithIntl(<Dashboard />);
      expect(document.getElementById("tile-days")).toBeNull();
      input();

      labData = persona("thirtyDays");
      rerender(<Dashboard />);
      expect(await historyRows()).toHaveLength(20);
      await frames(3);
      expect(scrolled).toEqual(expected);
      expect(tileText("days")).toBe("Days played30 daysSince Sep 9, 2026");
    }, 15_000);

    it.each([
      ["nothing", () => undefined, [{ id: "tile-days", historyRows: 20, analysis: true }]],
      ["a wheel turn", () => fireEvent.wheel(window), []],
      ["a key press", () => fireEvent.keyDown(window, { key: "PageDown" }), []],
    ])("after %s from the player before the server-drawn page hydrated, is scrolled to only if there was no input", async (_, input, expected) => {
      labData = { ...persona("thirtyDays"), storage: "loading", records: [], today: "" };
      const container = document.body.appendChild(document.createElement("div"));
      container.innerHTML = renderToString(
        <NextIntlClientProvider locale="en" messages={messages}>
          <Dashboard />
        </NextIntlClientProvider>,
      );
      for (const inert of container.querySelectorAll("script")) {
        const parsed = document.createElement("script");
        parsed.textContent = inert.textContent;
        inert.replaceWith(parsed);
      }
      input();

      const { rerender } = renderWithIntl(<Dashboard />, { container, hydrate: true });
      labData = persona("thirtyDays");
      rerender(<Dashboard />);
      expect(await historyRows()).toHaveLength(20);
      await frames(3);
      expect(scrolled).toEqual(expected);
    }, 15_000);
  });

  it("asks the browser whether it keeps the record, and offers a copy when it does not", async () => {
    const storage = Object.getOwnPropertyDescriptor(navigator, "storage");
    Object.defineProperty(navigator, "storage", { configurable: true, value: { persisted: () => Promise.resolve(false) } });
    URL.createObjectURL = jest.fn(() => "blob:card");
    URL.revokeObjectURL = jest.fn();
    try {
      show("thirtyDays");

      expect((await screen.findByRole("heading", { name: "Keep a copy of your record" }, { timeout: 10_000 })).closest("aside")?.getAttribute("data-note")).toBe("backup");
    } finally {
      if (storage) Object.defineProperty(navigator, "storage", storage);
      else delete (navigator as { storage?: unknown }).storage;
    }
  }, 15_000);

  it("lists the figures still to unlock in one list, nearest first, in place of a card each", () => {
    show("twoRounds");

    const list = screen.getByRole("region", { name: "Unlocks next" });
    expect([...list.querySelectorAll("li")].map((item) => item.textContent)).toEqual([
      "Memory span1 more round at 80% or better with 3 or more piecesPlay a round →",
      "Pieces held3 more rounds and 1 more day of playPlay a round →",
      "Recall after review3 more reviews after the same gapPlay a round →",
      "Recall pace4 more rounds at 6 pieces, 10 sPlay 6 pieces, 10 s →",
    ]);
    expect([...document.querySelectorAll('.lab-tile:is([data-state="warming"], [data-state="empty"])')].map((tile) => tile.getAttribute("data-tile"))).toEqual(["streak", "daily"]);
    expect(tileText("speed")).toBeUndefined();

    fireEvent.click(within(list).getByRole("button", { name: "Show all 9" }));
    expect(unlockText("speed")).toBe("Recall pace4 more rounds at 6 pieces, 10 sPlay 6 pieces, 10 s →");
    expect(within(document.querySelector('[data-unlock="speed"]') as HTMLElement).getByRole("link")).toHaveAttribute("href", "/game?pieceCount=6&memorizeTime=10&from=dashboard");
    expect(unlockText("rating")).toBe("Skill ratingNothing yet.Play a round →");
    expect(unlockText("plans")).toBe("PlanNot set yet.Choose one in the full record →");
    expect(within(document.querySelector('[data-unlock="plans"]') as HTMLElement).getByRole("link")).toHaveAttribute("href", "/#record");
    expect(within(list).getByRole("button", { name: "Show fewer" })).toHaveAttribute("aria-expanded", "true");
  });

  it("leads the summary with the day streak and the daily board, and asks a player who played today to come back tomorrow", () => {
    show("twoRounds");

    const today = document.querySelector('.lab-tiles[data-size="today"]') as HTMLElement;
    expect([...today.querySelectorAll("[data-tile]")].map((tile) => tile.getAttribute("data-tile"))).toEqual(["streak", "daily"]);
    expect(tileText("streak")).toBe("Day streakUnlocks with 1 more day of play.Come back tomorrow.Remind me dailyDownloads a calendar event that repeats every day when the board opens.");
    const streak = within(document.querySelector('[data-tile="streak"]') as HTMLElement);
    expect(streak.queryByRole("link")).toBeNull();
    expect(streak.getByRole("button", { name: "Remind me daily" })).toHaveAccessibleDescription("Downloads a calendar event that repeats every day when the board opens.");
    expect(document.querySelector("#summary .lab-tiles")).toBe(today);
  });

  it("holds the stale note's row open before the record loads, so the note fills it instead of arriving", () => {
    labData = { ...persona("stale"), storage: "loading", records: [], today: "" };
    const { rerender } = renderWithIntl(<Dashboard />);
    expect(document.querySelector("header .lab-dash-notes")?.textContent).toBe("");

    labData = persona("stale");
    rerender(<Dashboard />);
    expect(document.querySelector("header .lab-dash-notes")?.textContent).toBe("Last played 20 days ago. Figures marked so are from then.");
  });

  it.each([
    ["en", "Longest streak: 3 days"],
    ["cs", "Nejdelší série: 3 dny"],
    ["da", "Længste stime: 3 dage"],
    ["de", "Längste Serie: 3 Tage"],
    ["es", "Racha más larga: 3 días"],
    ["fi", "Pisin putki: 3 päivää"],
    ["fr", "Plus longue série : 3 jours"],
    ["hi", "सबसे लंबा सिलसिला: 3 दिन"],
    ["hu", "Leghosszabb sorozat: 3 nap"],
    ["id", "Beruntun terpanjang: 3 hari"],
    ["it", "Serie più lunga: 3 giorni"],
    ["ja", "最長連続3日"],
    ["ko", "최장 연속 3일"],
    ["nl", "Langste reeks: 3 dagen"],
    ["no", "Lengste rekke: 3 dager"],
    ["pl", "Najdłuższa seria: 3 dni"],
    ["pt-BR", "Maior sequência: 3 dias"],
    ["ro", "Cea mai lungă serie: 3 zile"],
    ["ru", "Самая длинная серия: 3 дня"],
    ["sv", "Längsta svit: 3 dagar"],
    ["tr", "En uzun seri: 3 gün"],
    ["vi", "Chuỗi dài nhất: 3 ngày"],
    ["zh-CN", "最长连续 3 天"],
    ["zh-TW", "最長連續 3 天"],
  ])("names the streak the longest run belongs to in %s", async (locale, longest) => {
    labData = persona("threeDays");
    const { default: messages } = await import(`../../../../messages/${locale}.json`);
    renderWithIntl(<Dashboard />, { locale, messages });

    expect(document.querySelector('[data-tile="streak"] .lab-tile-note')?.textContent).toBe(longest);
  });
});

describe("the Telegram line", () => {
  const link = () => screen.queryByRole("link", { name: "Join the Telegram group" });

  it.each<PersonaName>(["newVisitor", "twoRounds"])("is not shown to the %s persona, who has fewer than 3 rounds", (name) => {
    show(name);

    expect(link()).toBeNull();
  });

  it("is shown to a returning player, as a plain outbound link", () => {
    show("threeDays");

    expect(screen.getByText(/Compare notes with other players\./)).toBeInTheDocument();
    expect(link()).toHaveAttribute("href", "https://t.me/TheMemoryChess");
    expect(link()).toHaveAttribute("id", "community-dashboard");
  });
});
