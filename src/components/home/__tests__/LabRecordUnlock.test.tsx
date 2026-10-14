import { fireEvent, renderWithIntl, screen, within } from "@/test-utils/intl";
import { LabRecordSection } from "@/components/home/LabRecordSection";
import { trackEvent } from "@/lib/analytics/events";
import { LAB_METRICS } from "@/lib/lab/metrics";
import { LAB_THRESHOLDS } from "@/lib/lab/readiness";
import { summarize } from "@/lib/lab/summary";
import { personaRounds } from "@/lib/lab/personas";
import { persona } from "@/test-utils/labPersona";
import { round } from "@/lib/lab/__tests__/fixtures";
import { readFileSync } from "node:fs";
import { join } from "node:path";

jest.mock("@/lib/analytics/events", () => ({ trackEvent: jest.fn() }));

const css = readFileSync(join(__dirname, "../lab-instruments.css"), "utf8");
const PLAY_HREF = "/game?pieceCount=6&memorizeTime=10&source=home_quick";

const strip = () => screen.queryByRole("list", { name: "Still to unlock" });
const rows = () => within(strip()!).getAllByRole("listitem").map((item) => Array.from(item.children, (part) => part.textContent));
const needs = () => rows().map(([, need]) => need);
const summary = () => screen.getByText(/figures unlocked$/).textContent;
const staleNotes = (container: HTMLElement) =>
  [...container.querySelectorAll(".lab-stale")].map((note) => [note.closest(".lab-panel")!.classList[1], note.textContent]);

describe("unlock strip", () => {
  it("lists every threshold for a new visitor, before the record has loaded too", () => {
    renderWithIntl(<LabRecordSection record={persona("newVisitor", "")} />);

    expect(rows()).toEqual([
      ["Fig. 1 · Memory span", "2 rounds at 80%+ with 3+ pieces"],
      ["Fig. 2 · Pieces held", "5 rounds over 2 days"],
      ["Fig. 3 · Accuracy over time", "5 rounds at one setting over 2 days"],
      ["Fig. 4 · Recall pace", "5 rounds at one setting"],
      ["Fig. 6 · Days in a row", "2 days played"],
      ["Fig. 7 · Forgetting curve", "3 reviews after the same gap"],
      ["Fig. 8 · Lab notebook", "1 round"],
      ["Fig. 9 · Miss map", "10 sightings per file and rank"],
      ["Fig. 10 · Recall by piece type", "20 sightings of a non-king piece"],
      ["Fig. 11 · Insights", "10 rounds"],
    ]);
    expect(summary()).toBe("0 of 10 figures unlocked");
    expect(screen.getByRole("link", { name: "Play a round →" })).toHaveAttribute("href", PLAY_HREF);
  });

  it("says what two rounds on one day still need", () => {
    renderWithIntl(<LabRecordSection record={persona("twoRounds")} />);

    expect(rows()).toEqual([
      ["Fig. 1 · Memory span", "1 more round at 80%+ with 3+ pieces"],
      ["Fig. 2 · Pieces held", "3 more rounds, 1 more day"],
      ["Fig. 3 · Accuracy over time", "4 more game rounds at 6 pieces, 10\u00a0s, 1 more day"],
      ["Fig. 4 · Recall pace", "4 more game rounds at 6 pieces, 10\u00a0s"],
      ["Fig. 6 · Days in a row", "1 more day played"],
      ["Fig. 7 · Forgetting curve", "3 more reviews after the same gap"],
      ["Fig. 9 · Miss map", "10 more sightings on the least seen file or rank"],
      ["Fig. 10 · Recall by piece type", "14 more sightings of a non-king piece"],
      ["Fig. 11 · Insights", "8 more rounds"],
    ]);
    expect(summary()).toBe("1 of 10 figures unlocked");
  });

  it("leaves out what an easy-only player can already read", () => {
    renderWithIntl(<LabRecordSection record={persona("easyOnly")} />);

    expect(rows()).toEqual([
      ["Fig. 1 · Memory span", "1 round with 3+ pieces"],
      ["Fig. 7 · Forgetting curve", "3 more reviews after the same gap"],
      ["Fig. 9 · Miss map", "4 more sightings on the least seen file or rank"],
      ["Fig. 10 · Recall by piece type", "20 more sightings of a non-king piece"],
    ]);
    expect(summary()).toBe("6 of 10 figures unlocked");
  });

  describe("on phones", () => {
    const older = () => rows().map((_, index) => within(strip()!).getAllByRole("listitem")[index].getAttribute("data-older"));
    const toggle = () => within(screen.getByText(/figures unlocked$/).closest(".lab-unlock") as HTMLElement).queryByRole("button", { hidden: true });
    const rule = (selector: string) => css.match(new RegExp(`@media \\(max-width: 640px\\) \\{[^@]*?${selector.replace(/[[\]".]/g, "\\$&")} \\{([^}]*)\\}`))?.[1] ?? "";

    it("marks every row past the next three, and offers Show all, while the server still renders every row", () => {
      renderWithIntl(<LabRecordSection record={persona("twoRounds")} />);

      expect(summary()).toBe("1 of 10 figures unlocked");
      expect(rows()).toHaveLength(9);
      expect(older()).toEqual([null, null, null, ...Array(6).fill("narrow")]);
      expect(toggle()).toHaveTextContent("Show all 9 figures");
    });

    it("hides the marked rows only at the phone breakpoint, by attribute, and shows the toggle only there", () => {
      const everywhere = css.replace(/@media[^{]*\{(?:[^{}]*\{[^}]*\})*[^{}]*\}/g, "");

      expect(rule('.lab-unlock [data-older="narrow"]')).toMatch(/display:\s*none/);
      expect(rule('.lab-unlock-toggle[data-shown="narrow"]')).toMatch(/display:\s*block/);
      expect(everywhere).toMatch(/\.lab-unlock-toggle\[data-shown="narrow"\][^{]*\{[^}]*display:\s*none/);
      expect(everywhere).not.toMatch(/\.lab-unlock[^{]*\[data-older[^{]*\{[^}]*display:\s*none/);
    });

    it("shows every row on request and folds back to three", () => {
      renderWithIntl(<LabRecordSection record={persona("twoRounds")} />);
      const button = toggle()!;

      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(button).toHaveAttribute("aria-controls", strip()!.id);

      fireEvent.click(button);

      expect(button).toHaveAttribute("aria-expanded", "true");
      expect(button).toHaveTextContent("Show fewer");
      expect(older()).toEqual(Array(9).fill(null));

      fireEvent.click(button);

      expect(button).toHaveTextContent("Show all 9 figures");
      expect(older().filter(Boolean)).toHaveLength(6);
    });

    it("folds only the fourth row when four figures are locked", () => {
      renderWithIntl(<LabRecordSection record={persona("easyOnly")} />);

      expect(older()).toEqual([null, null, null, "narrow"]);
      expect(toggle()).toHaveTextContent("Show all 4 figures");
    });
  });

  it("mounts new lines when the record arrives, so a line that rewraps never moves the ones below it", () => {
    const { rerender } = renderWithIntl(<LabRecordSection record={persona("newVisitor", "")} />);
    const serverLines = within(strip()!).getAllByRole("listitem");

    rerender(<LabRecordSection record={persona("twoRounds")} />);

    expect(serverLines.map((line) => line.isConnected)).toEqual(Array(10).fill(false));
    expect(rows()).toHaveLength(9);
  });

  it("prints every threshold from the registry, so the copy cannot drift from the panels", () => {
    renderWithIntl(<LabRecordSection record={persona("newVisitor", "")} />);
    const { span, piecesHeld, trend, speed, streak, curve, notebook, missMap, typeRecall, insights } = LAB_METRICS;

    expect(needs().map((need) => need!.match(/\d+/g)!.map(Number))).toEqual([
      [span.thresholds.qualifyingRounds, LAB_THRESHOLDS.spanAccuracy, LAB_THRESHOLDS.spanMinPieces],
      [piecesHeld.thresholds.rounds, piecesHeld.thresholds.days],
      [trend.thresholds.rounds, trend.thresholds.days],
      [speed.thresholds.rounds],
      [streak.thresholds.days],
      [curve.thresholds.reviews],
      [notebook.thresholds.rounds],
      [missMap.thresholds.exposures],
      [typeRecall.thresholds.exposures],
      [insights.thresholds.rounds],
    ]);
  });

  it("asks for a round with a piece right before speed can count rounds at a setting", () => {
    const records = Array.from({ length: 3 }, (_, index) =>
      round({ id: `blank${index}`, placedFen: "8/8/8/8/8/8/8/8", localDay: "2026-10-08", endedAt: Date.UTC(2026, 9, 8, 9 + index) }),
    );
    renderWithIntl(<LabRecordSection record={{ ...persona("newVisitor"), records, summary: summarize(records) }} />);

    expect(rows()).toContainEqual(["Fig. 4 · Recall pace", "1 round with a piece right"]);
  });

  it("drops the streak and piece recall lines exactly when their copy says they unlock", () => {
    const queenOnly = "4k3/8/8/3q4/8/8/8/4K3";
    const records = Array.from({ length: 20 }, (_, index) =>
      round({ id: `q${index}`, targetFen: queenOnly, placedFen: queenOnly, pieceCount: 3, ...(index === 0 && { localDay: "2026-09-01", endedAt: Date.UTC(2026, 8, 1, 12) }) }),
    );
    renderWithIntl(<LabRecordSection record={{ ...persona("newVisitor", "2026-10-07"), records, summary: summarize(records) }} />);

    expect(rows()).toEqual([
      ["Fig. 7 · Forgetting curve", "3 more reviews after the same gap"],
      ["Fig. 9 · Miss map", "10 more sightings on the least seen file or rank"],
    ]);
  });

  it("says in one line, in the same box, that every figure is unlocked once each can be read", () => {
    const records = [...personaRounds("thirtyDays"), ...personaRounds("reviewCurve")];
    const { container } = renderWithIntl(<LabRecordSection record={{ ...persona("thirtyDays"), records, summary: summarize(records) }} />);

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

    fireEvent.click(within(screen.getByRole("list", { name: "Still to unlock" }).parentElement!).getByRole("link"));

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
      ["lab-p-insights", "Last played 20 days ago. Play a round →"],
      ["lab-p-bests", "Last played 20 days ago. Play a round →"],
    ]);
    expect(rows()).toEqual([
      ["Fig. 7 · Forgetting curve", "3 more reviews after the same gap"],
      ["Fig. 9 · Miss map", "2 more sightings on the least seen file or rank"],
    ]);
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
