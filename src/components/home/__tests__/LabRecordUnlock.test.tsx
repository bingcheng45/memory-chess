import { fireEvent, renderWithIntl, screen, within } from "@/test-utils/intl";
import { LabRecordSection } from "@/components/home/LabRecordSection";
import { trackEvent } from "@/lib/analytics/events";
import { LAB_METRICS } from "@/lib/lab/metrics";
import { LAB_THRESHOLDS } from "@/lib/lab/readiness";
import { summarize } from "@/lib/lab/summary";
import { persona } from "@/test-utils/labPersona";
import { round } from "@/lib/lab/__tests__/fixtures";
import { readFileSync } from "node:fs";
import { join } from "node:path";

jest.mock("@/lib/analytics/events", () => ({ trackEvent: jest.fn() }));

const css = readFileSync(join(__dirname, "../lab-instruments.css"), "utf8");
const PLAY_HREF = "/game?pieceCount=6&memorizeTime=10&source=home_quick";

const strip = () => screen.queryByRole("list", { name: "What playing unlocks" });
const items = () => within(strip()!).getAllByRole("listitem").map((item) => item.textContent);
const staleNotes = (container: HTMLElement) =>
  [...container.querySelectorAll(".lab-stale")].map((note) => [note.closest(".lab-panel")!.classList[1], note.textContent]);

describe("unlock strip", () => {
  it("lists every threshold for a new visitor, before the record has loaded too", () => {
    renderWithIntl(<LabRecordSection record={persona("newVisitor", "")} />);

    expect(items()).toEqual([
      "Memory span · 2 rounds at 80% with 3+ pieces",
      "Pieces held · 5 rounds over 2 days",
      "Trend · 5 rounds of one setting over 2 days",
      "Speed · 5 rounds of one setting",
      "Streak · play on 2 days",
      "Miss map · 10 sightings per file and rank",
      "Piece recall · 20 sightings of a non-king piece",
    ]);
    expect(screen.getByRole("link", { name: "Play a round →" })).toHaveAttribute("href", PLAY_HREF);
  });

  it("says what two rounds on one day still need", () => {
    renderWithIntl(<LabRecordSection record={persona("twoRounds")} />);

    expect(items()).toEqual([
      "Memory span · 1 more round at 80% with 3+ pieces",
      "Pieces held · 3 more rounds, 1 more day",
      "Trend · 4 more game rounds at 6 pieces, 10\u00a0s, 1 more day",
      "Speed · 4 more game rounds at 6 pieces, 10\u00a0s",
      "Streak · play on 1 more day",
      "Miss map · 10 more sightings on the least seen file or rank",
      "Piece recall · 14 more sightings of a non-king piece",
    ]);
  });

  it("leaves out what an easy-only player can already read", () => {
    renderWithIntl(<LabRecordSection record={persona("easyOnly")} />);

    expect(items()).toEqual([
      "Memory span · 1 round with 3+ pieces",
      "Miss map · 4 more sightings on the least seen file or rank",
      "Piece recall · 20 more sightings of a non-king piece",
    ]);
  });

  it("shows every line at every width: no toggle in the strip, and no rule in the stylesheet that hides any part of it", () => {
    const { container } = renderWithIntl(<LabRecordSection record={persona("twoRounds")} />);
    const hiding = [...css.matchAll(/([^{}]*\.lab-unlock[^{}]*)\{([^}]*)\}/g)]
      .filter(([, , body]) => /display:\s*none|visibility:\s*hidden/.test(body))
      .map(([, selector]) => selector.trim());

    expect(within(container.querySelector(".lab-unlock") as HTMLElement).queryAllByRole("button", { hidden: true })).toEqual([]);
    expect(items()).toHaveLength(7);
    expect(hiding).toEqual([]);
  });

  it("prints every threshold from the registry, so the copy cannot drift from the panels", () => {
    renderWithIntl(<LabRecordSection record={persona("newVisitor", "")} />);
    const { span, piecesHeld, trend, speed, streak, missMap, typeRecall } = LAB_METRICS;

    expect(items().map((line) => line!.match(/\d+/g)!.map(Number))).toEqual([
      [span.thresholds.qualifyingRounds, LAB_THRESHOLDS.spanAccuracy, LAB_THRESHOLDS.spanMinPieces],
      [piecesHeld.thresholds.rounds, piecesHeld.thresholds.days],
      [trend.thresholds.rounds, trend.thresholds.days],
      [speed.thresholds.rounds],
      [streak.thresholds.days],
      [missMap.thresholds.exposures],
      [typeRecall.thresholds.exposures],
    ]);
  });

  it("asks for a round with a piece right before speed can count rounds at a setting", () => {
    const records = Array.from({ length: 3 }, (_, index) =>
      round({ id: `blank${index}`, placedFen: "8/8/8/8/8/8/8/8", localDay: "2026-10-08", endedAt: Date.UTC(2026, 9, 8, 9 + index) }),
    );
    renderWithIntl(<LabRecordSection record={{ ...persona("newVisitor"), records, summary: summarize(records) }} />);

    expect(items()).toContain("Speed · 1 round with a piece right");
  });

  it("drops the streak and piece recall lines exactly when their copy says they unlock", () => {
    const queenOnly = "4k3/8/8/3q4/8/8/8/4K3";
    const records = Array.from({ length: 20 }, (_, index) =>
      round({ id: `q${index}`, targetFen: queenOnly, placedFen: queenOnly, pieceCount: 3, ...(index === 0 && { localDay: "2026-09-01", endedAt: Date.UTC(2026, 8, 1, 12) }) }),
    );
    renderWithIntl(<LabRecordSection record={{ ...persona("newVisitor", "2026-10-07"), records, summary: summarize(records) }} />);

    expect(items()).toEqual(["Miss map · 10 more sightings on the least seen file or rank"]);
  });

  it("says in one line, in the same box, that every figure is unlocked once each can be read", () => {
    const { container } = renderWithIntl(<LabRecordSection record={persona("thirtyDays")} />);

    expect(strip()).toBeNull();
    expect(container.querySelector(".lab-unlock")?.textContent).toBe("Every figure below is unlocked.");
  });

  it("lists nothing to unlock and offers no play link when this window keeps no rounds", () => {
    const { container } = renderWithIntl(<LabRecordSection record={{ ...persona("newVisitor"), storage: "unavailable" }} />);

    expect(strip()).toBeNull();
    expect(container.querySelector(".lab-unlock")).toBeEmptyDOMElement();
    expect(screen.getByText(/Not saved in private windows/)).toBeInTheDocument();
  });

  it("reports a play from the strip as a counts-only panel action", () => {
    renderWithIntl(<LabRecordSection record={persona("twoRounds")} />);

    fireEvent.click(within(screen.getByRole("list", { name: "What playing unlocks" }).parentElement!).getByRole("link"));

    expect(jest.mocked(trackEvent).mock.calls.at(-1)).toEqual([{ name: "lab_panel_action", params: { panel: "unlock", action: "play" } }]);
  });
});

describe("stale panels", () => {
  it("keeps each figure and says when the last round was, with a play link", () => {
    const { container } = renderWithIntl(<LabRecordSection record={persona("stale")} />);

    expect(staleNotes(container)).toEqual([
      ["lab-p-span", "Last played 20 days ago. Play a round →"],
      ["lab-p-held", "Last played 20 days ago. Play a round →"],
      ["lab-p-spark", "Last played 20 days ago. Play a round →"],
      ["lab-p-speed", "Last played 20 days ago. Play a round →"],
      ["lab-p-streak", "Last played 20 days ago. Play a round →"],
      ["lab-p-types", "Last played 20 days ago. Play a round →"],
      ["lab-p-bests", "Last played 20 days ago. Play a round →"],
    ]);
    expect(items()).toEqual(["Miss map · 2 more sightings on the least seen file or rank"]);
    expect(container.querySelector(".lab-p-spark svg")).not.toBeNull();
  });

  it("reports which panel the play came from", () => {
    const { container } = renderWithIntl(<LabRecordSection record={persona("stale")} />);

    fireEvent.click(within(container.querySelector(".lab-p-types") as HTMLElement).getByRole("link", { name: "Play a round →" }));

    expect(jest.mocked(trackEvent).mock.calls.at(-1)).toEqual([{ name: "lab_panel_action", params: { panel: "typeRecall", action: "play" } }]);
  });

  it.each(["twoRounds", "thirtyDays", "easyOnly"] as const)("adds no note for %s, who played today", (name) => {
    const { container } = renderWithIntl(<LabRecordSection record={persona(name)} />);

    expect(staleNotes(container)).toEqual([]);
  });

  it("renders no date text before the client knows today", () => {
    const { container } = renderWithIntl(<LabRecordSection record={persona("stale", "")} />);

    expect(staleNotes(container)).toEqual([]);
  });
});

describe("section view", () => {
  let watchers: { callback: IntersectionObserverCallback; targets: Element[]; disconnect: jest.Mock }[] = [];
  beforeEach(() => {
    watchers = [];
    window.IntersectionObserver = jest.fn((callback: IntersectionObserverCallback) => {
      const watcher = { callback, targets: [] as Element[], disconnect: jest.fn(), unobserve: jest.fn(), observe: (target: Element) => watcher.targets.push(target) };
      watchers.push(watcher);
      return watcher;
    }) as unknown as typeof IntersectionObserver;
    jest.mocked(trackEvent).mockClear();
  });
  afterEach(() => Reflect.deleteProperty(window, "IntersectionObserver"));

  it("sends lab_section_view once, the first time the section is in sight", () => {
    renderWithIntl(<LabRecordSection record={persona("newVisitor")} />);
    const { callback, disconnect } = watchers.find(({ targets }) => targets.some((target) => target.id === "record"))!;
    const sight = (isIntersecting: boolean) => callback([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver);

    sight(false);
    sight(true);

    expect(jest.mocked(trackEvent).mock.calls).toEqual([[{ name: "lab_section_view", params: {} }]]);
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
