import { fireEvent, renderWithIntl, screen, within } from "@/test-utils/intl";
import { LabRecordSection } from "@/components/home/LabRecordSection";
import type { LabRecord } from "@/components/home/useLabRecord";
import { trackEvent } from "@/lib/analytics/events";
import { personaRounds, PERSONA_TODAY, type PersonaName } from "@/lib/lab/personas";
import { EMPTY_SUMMARY, summarize } from "@/lib/lab/summary";
import { round } from "@/lib/lab/__tests__/fixtures";

jest.mock("@/lib/analytics/events", () => ({ trackEvent: jest.fn() }));

const PLAY_HREF = "/game?pieceCount=6&memorizeTime=10&source=home_quick";

function persona(name: PersonaName, today = PERSONA_TODAY): LabRecord {
  const records = personaRounds(name, PERSONA_TODAY);
  return {
    storage: "available",
    records,
    summary: records.length ? summarize(records) : EMPTY_SUMMARY,
    lastBackup: null,
    today,
    download: jest.fn(() => Promise.resolve()),
    importFile: jest.fn(() => Promise.resolve({ ok: true as const, added: 0, rejected: 0, overCap: 0, summary: null })),
  };
}

const strip = () => screen.queryByRole("list", { name: "What playing unlocks" });
const items = () => within(strip()!).getAllByRole("listitem").map((item) => item.textContent);
const staleNotes = (container: HTMLElement) =>
  [...container.querySelectorAll(".lab-stale")].map((note) => [note.closest(".lab-panel")!.classList[1], note.textContent]);

describe("unlock strip", () => {
  it("lists every threshold for a new visitor, before the record has loaded too", () => {
    renderWithIntl(<LabRecordSection record={persona("newVisitor", "")} />);

    expect(items()).toEqual([
      "Trend unlocks at 5 rounds of one setting on 2 different days.",
      "Streak unlocks when you play on 2 different days.",
      "Piece recall unlocks when one piece other than the king reaches 20 sightings.",
      "Miss map unlocks at 10 sightings on every file and rank.",
    ]);
    expect(screen.getByRole("link", { name: "Play a round →" })).toHaveAttribute("href", PLAY_HREF);
  });

  it("says what two rounds on one day still need", () => {
    renderWithIntl(<LabRecordSection record={persona("twoRounds")} />);

    expect(items()).toEqual([
      "Trend: 4 more rounds at 6 pieces, 10s, at least one on another day in games.",
      "Streak: play on 1 more day, in a row or not.",
      "Piece recall: 14 more sightings until one piece other than the king reaches 20.",
      "Miss map: 10 more sightings on the least seen file or rank.",
    ]);
  });

  it("leaves out what an easy-only player can already read", () => {
    renderWithIntl(<LabRecordSection record={persona("easyOnly")} />);

    expect(items()).toEqual([
      "Piece recall: 20 more sightings until one piece other than the king reaches 20.",
      "Miss map: 4 more sightings on the least seen file or rank.",
    ]);
  });

  it("drops the streak and piece recall lines exactly when their copy says they unlock", () => {
    const queenOnly = "4k3/8/8/3q4/8/8/8/4K3";
    const records = Array.from({ length: 20 }, (_, index) =>
      round({ id: `q${index}`, targetFen: queenOnly, placedFen: queenOnly, pieceCount: 3, ...(index === 0 && { localDay: "2026-09-01", endedAt: Date.UTC(2026, 8, 1, 12) }) }),
    );
    renderWithIntl(<LabRecordSection record={{ ...persona("newVisitor", "2026-10-07"), records, summary: summarize(records) }} />);

    expect(items()).toEqual(["Miss map: 10 more sightings on the least seen file or rank."]);
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
      ["lab-p-spark", "Last played 20 days ago. Play a round →"],
      ["lab-p-streak", "Last played 20 days ago. Play a round →"],
      ["lab-p-types", "Last played 20 days ago. Play a round →"],
      ["lab-p-bests", "Last played 20 days ago. Play a round →"],
    ]);
    expect(items()).toEqual(["Miss map: 2 more sightings on the least seen file or rank."]);
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
