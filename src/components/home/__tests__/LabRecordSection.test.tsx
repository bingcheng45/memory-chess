import { fireEvent, renderWithIntl, screen, within } from "@/test-utils/intl";
import { LabRecordSection } from "@/components/home/LabRecordSection";
import type { LabRecord } from "@/components/home/useLabRecord";
import { buildRoundRecord, type RoundRecordV1 } from "@/lib/lab/record";
import { EMPTY_SUMMARY, summarize } from "@/lib/lab/summary";
import { trackEvent } from "@/lib/analytics/events";

jest.mock("@/lib/analytics/events", () => ({ trackEvent: jest.fn() }));

const TARGET = "4k3/8/8/3q4/8/5N2/8/4K3";

function rounds(count: number, days: number): RoundRecordV1[] {
  return Array.from({ length: count }, (_, index) =>
    buildRoundRecord({
      id: `r${index}`,
      source: "game",
      endedAt: index,
      localDay: `2026-10-${String(7 - (index % days)).padStart(2, "0")}`,
      pieceCount: 4,
      memorizeSeconds: 10,
      targetFen: TARGET,
      placedFen: index % 2 ? "4k3/8/8/8/8/8/8/4K3" : TARGET,
      memorizeMs: 10000,
      solveMs: 15000,
    }),
  );
}

function record(records: RoundRecordV1[], overrides: Partial<LabRecord> = {}): LabRecord {
  return {
    storage: "available",
    records,
    summary: records.length ? summarize(records) : EMPTY_SUMMARY,
    lastBackup: null,
    today: "2026-10-07",
    download: jest.fn(() => Promise.resolve()),
    importFile: jest.fn(() => Promise.resolve({ ok: true as const, added: 3, rejected: 1, overCap: 0, summary: null })),
    ...overrides,
  };
}

const panel = (name: string) => screen.getByText(new RegExp(`^Fig\\. 6\\.\\d+ · ${name}$`)).closest(".lab-panel") as HTMLElement;

describe("LabRecordSection", () => {
  it("shows the sample panels, tagged Sample, before any round is played", () => {
    renderWithIntl(<LabRecordSection record={record([])} />);

    expect(within(panel("Accuracy over time")).getByText("Sample")).toBeInTheDocument();
    expect(within(panel("Miss map")).getByText("Sample")).toBeInTheDocument();
    expect(within(panel("Days in a row")).getByText("Sample")).toBeInTheDocument();
    expect(within(panel("Forgetting curve")).getByText("Illustrative")).toBeInTheDocument();
    expect(within(panel("Personal bests")).getByText(/appears after your first round/)).toBeInTheDocument();
  });

  it("shows the leaderboard as a Sample sketch with no row claiming to be the visitor", () => {
    renderWithIntl(<LabRecordSection record={record([])} />);
    const board = panel("Leaderboard");

    expect(within(board).getByText("Sample")).toBeInTheDocument();
    expect(within(board).queryByText("Live on site")).toBeNull();
    expect(within(board).queryByText("you")).toBeNull();
    expect(within(board).queryByText("--%")).toBeNull();
    const sketch = within(board).getByText("12 pieces").closest("[aria-hidden='true']") as HTMLElement;
    expect([...sketch.querySelectorAll(".lab-lb-row")].map((row) => row.lastElementChild?.textContent)).toEqual(["12 pieces", "10 pieces", "8 pieces"]);
    expect(
      within(board).getByText(
        "Each difficulty is ranked by correct pieces, then fewer wrong pieces, then faster memorize time, then faster solve time. Every row shows the player's country.",
      ),
    ).toBeInTheDocument();
    expect(within(board).getByRole("link", { name: "Open leaderboard →" })).toHaveAttribute("href", "/leaderboard");
    expect(within(board).getByText(/Filter by country/)).toHaveTextContent("Filter by country Proposed");
  });

  it("names the streak panel for what it counts, in the sample and the real record", () => {
    const { unmount } = renderWithIntl(<LabRecordSection record={record([])} />);

    expect(screen.getByText("Fig. 6.4 · Days in a row")).toBeInTheDocument();
    expect(screen.queryByText(/Daily challenge/)).toBeNull();
    expect(screen.queryByText(/shared position|Same board for everyone/)).toBeNull();
    expect(within(panel("Days in a row")).getByText("Any finished round, game or practice, counts for its day. Play on two days in a row to start a streak.")).toBeInTheDocument();
    expect(within(panel("Accuracy over time")).getByText("Your line, round by round.")).toBeInTheDocument();
    unmount();

    renderWithIntl(<LabRecordSection record={record(rounds(2, 1))} />);
    expect(screen.getByText("Fig. 6.4 · Days in a row")).toBeInTheDocument();
  });

  it("says how many more rounds each panel needs below its threshold", () => {
    renderWithIntl(<LabRecordSection record={record(rounds(2, 1))} />);

    expect(within(panel("Accuracy over time")).getByText("3 more rounds at 4 pieces, 10s, at least one on another day, draws your game trend.")).toBeInTheDocument();
    expect(within(panel("Days in a row")).getByText("Play on one more day to start a streak.")).toBeInTheDocument();
    expect(within(panel("Recall by piece type")).getByText("About 18 more rounds until a piece other than the king has 20 sightings.")).toBeInTheDocument();
    expect(within(panel("Personal bests")).getByText("Game · 4 pieces · 10s")).toBeInTheDocument();
    expect(within(panel("Personal bests")).getByText("100% · rebuilt in 15.0s")).toBeInTheDocument();
  });

  describe("keeps the Phase 0 panels when the summary disagrees with the round log", () => {
    const tag = (name: string) => panel(name).querySelector(".lab-tag")?.textContent ?? null;
    const sampleTrend = "Sample record · 12 rounds · Medium";

    it("tags the trend as the player's while its log is empty but the summary counts rounds", () => {
      renderWithIntl(<LabRecordSection record={record([], { summary: summarize(rounds(6, 3)) })} />);

      expect(tag("Accuracy over time")).toBe("Your record");
      expect(within(panel("Accuracy over time")).getByText(sampleTrend)).toBeInTheDocument();
    });

    it("shows no bests when the summary counts rounds but holds no best", () => {
      const played = rounds(5, 2);
      renderWithIntl(<LabRecordSection record={record(played, { summary: { ...summarize(played), bests: {} } })} />);

      expect(tag("Personal bests")).toBeNull();
      expect(within(panel("Personal bests")).getByText("Your best reading for each setting appears after your first round.")).toBeInTheDocument();
    });

    it("shows the sample trend and streak when the summary counts no round but lists days", () => {
      const summary = { ...EMPTY_SUMMARY, days: ["2026-10-06", "2026-10-07"] };
      renderWithIntl(<LabRecordSection record={record(rounds(5, 2), { summary })} />);

      expect(tag("Accuracy over time")).toBe("Sample");
      expect(within(panel("Accuracy over time")).getByText(sampleTrend)).toBeInTheDocument();
      expect(tag("Days in a row")).toBe("Sample");
      expect(within(panel("Days in a row")).getByText("Any finished round, game or practice, counts for its day. Play on two days in a row to start a streak.")).toBeInTheDocument();
    });

    it("draws the player's streak grid when the summary counts rounds but lists no day", () => {
      renderWithIntl(<LabRecordSection record={record([], { summary: { ...summarize(rounds(3, 1)), days: [] } })} />);

      expect(tag("Days in a row")).toBe("Your record");
      expect(within(panel("Days in a row")).getByRole("img")).toHaveAccessibleName("Your last 14 days: 0 days played.");
      expect(within(panel("Days in a row")).getByText("Play on one more day to start a streak.")).toBeInTheDocument();
    });
  });

  it("draws the player's own record once there is enough", () => {
    renderWithIntl(<LabRecordSection record={record(rounds(10, 3))} />);

    expect(within(panel("Accuracy over time")).getByText("Game · 4 pieces · 10s, your most played setting with a trend · From 10 rounds")).toBeInTheDocument();
    expect(within(panel("Accuracy over time")).getByRole("img")).toHaveAccessibleName(
      "Your accuracy over your last 10 game rounds at 4 pieces and 10 seconds, latest 50 percent.",
    );
    expect(within(panel("Days in a row")).getByText(/Current streak 3 days · longest 3 days/)).toBeInTheDocument();
    expect(within(panel("Recall by piece type")).getByText("About 10 more rounds until a piece other than the king has 20 sightings.")).toBeInTheDocument();
  });

  it("reads piece recall from pieces other than the king and shows kings as a baseline", () => {
    renderWithIntl(<LabRecordSection record={record(rounds(20, 3))} />);
    const types = panel("Recall by piece type");

    expect(within(types).getByText("Queen")).toBeInTheDocument();
    expect(within(types).getAllByText("50%")).toHaveLength(2);
    expect(within(types).queryByText("King")).toBeNull();
    expect(within(types).queryByText("Pawn")).toBeNull();
    expect(within(types).getByText("Kings are in every round, so they are a baseline. Recalled 40 of 40.")).toBeInTheDocument();
    expect(within(types).getByText("From 20 rounds")).toBeInTheDocument();
  });

  it("counts kings that were missed in the baseline", () => {
    const missedWhiteKing = rounds(20, 3).map((game, index) =>
      index < 9 ? buildRoundRecord({ ...game, pieceCount: 4, memorizeSeconds: 10, placedFen: "4k3/8/8/3q4/8/5N2/8/8" }) : game,
    );
    renderWithIntl(<LabRecordSection record={record(missedWhiteKing)} />);

    expect(within(panel("Recall by piece type")).getByText("Kings are in every round, so they are a baseline. Recalled 31 of 40.")).toBeInTheDocument();
  });

  it("tells a kings-only player why recall by piece type is empty, with the king baseline", () => {
    const kingsOnly = rounds(50, 3).map((game) =>
      buildRoundRecord({ ...game, pieceCount: 2, memorizeSeconds: 10, targetFen: "4k3/8/8/8/8/8/8/4K3", placedFen: "4k3/8/8/8/8/8/8/4K3" }),
    );
    renderWithIntl(<LabRecordSection record={record(kingsOnly)} />);
    const types = panel("Recall by piece type");

    expect(
      within(types).getByText("Your rounds so far were just the two kings. Play a round with more pieces to see recall by piece type."),
    ).toBeInTheDocument();
    expect(within(types).getByText("Kings are in every round, so they are a baseline. Recalled 100 of 100.")).toBeInTheDocument();
    expect(within(types).queryByText(/after your first round/)).toBeNull();
  });

  it("keeps the first-round empty state for recall by piece type before any round", () => {
    renderWithIntl(<LabRecordSection record={record([])} />);

    expect(within(panel("Recall by piece type")).getByText("Recall by piece type appears after your first round.")).toBeInTheDocument();
    expect(within(panel("Recall by piece type")).queryByText(/Kings are in every round/)).toBeNull();
  });

  it("plots practice on its own line when practice is the setting played most", () => {
    const practice = rounds(5, 2).map((game) =>
      buildRoundRecord({ ...game, source: "calibration", pieceCount: 4, memorizeSeconds: 10 }),
    );
    renderWithIntl(<LabRecordSection record={record([...practice, ...rounds(2, 1).map((game) => ({ ...game, id: `g${game.id}`, endedAt: 100 }))])} />);

    expect(within(panel("Accuracy over time")).getByText("Practice · 4 pieces · 10s, your most played setting with a trend · From 5 rounds")).toBeInTheDocument();
    expect(within(panel("Accuracy over time")).getByRole("img")).toHaveAccessibleName(
      "Your accuracy over your last 5 practice rounds at 4 pieces and 10 seconds, latest 100 percent.",
    );
  });

  it("draws the game trend that is ready over more practice rounds still on one day", () => {
    const practice = rounds(6, 1).map((game) => buildRoundRecord({ ...game, id: `p${game.id}`, source: "calibration", pieceCount: 4, memorizeSeconds: 10 }));
    const games = rounds(5, 3).map((game) => buildRoundRecord({ ...game, id: `g${game.id}`, endedAt: 100 + game.endedAt, pieceCount: 6, memorizeSeconds: 10 }));
    renderWithIntl(<LabRecordSection record={record([...practice, ...games])} />);

    expect(within(panel("Accuracy over time")).getByText("Game · 6 pieces · 10s, your most played setting with a trend · From 5 rounds")).toBeInTheDocument();
    expect(within(panel("Accuracy over time")).queryByText(/one more day/)).toBeNull();
  });

  it("says exactly what the most played setting still needs when no setting is ready", () => {
    const practice = rounds(4, 1).map((game) => buildRoundRecord({ ...game, id: `p${game.id}`, source: "calibration", pieceCount: 4, memorizeSeconds: 10 }));
    const games = rounds(3, 2).map((game) => buildRoundRecord({ ...game, id: `g${game.id}`, endedAt: 100 + game.endedAt, pieceCount: 6, memorizeSeconds: 10 }));
    renderWithIntl(<LabRecordSection record={record([...practice, ...games])} />);

    expect(
      within(panel("Accuracy over time")).getByText("1 more round at 4 pieces, 10s, played on another day, draws your practice trend."),
    ).toBeInTheDocument();
  });

  it("labels practice bests apart from game bests at the same setting", () => {
    const practice = buildRoundRecord({ ...rounds(1, 1)[0], id: "p", source: "calibration", pieceCount: 4, memorizeSeconds: 10, solveMs: 9000 });
    renderWithIntl(<LabRecordSection record={record([...rounds(2, 1), practice])} />);

    expect(within(panel("Personal bests")).getByText("Game · 4 pieces · 10s")).toBeInTheDocument();
    expect(within(panel("Personal bests")).getByText("Practice · 4 pieces · 10s")).toBeInTheDocument();
    expect(within(panel("Personal bests")).getByText("100% · rebuilt in 9.0s")).toBeInTheDocument();
  });

  describe("bests list", () => {
    const setting = (source: "game" | "calibration", memorizeSeconds: number, endedAt: number) =>
      buildRoundRecord({ ...rounds(1, 1)[0], id: `${source}${memorizeSeconds}`, source, pieceCount: 4, memorizeSeconds, endedAt });
    const rows = () =>
      [...panel("Personal bests").querySelectorAll(".lab-bests > div")].map((row) => [row.querySelector("dt")?.textContent, row.getAttribute("data-older")]);
    const EIGHT = [
      setting("game", 10, 1),
      setting("game", 9, 2),
      setting("game", 8, 8),
      setting("game", 7, 7),
      setting("game", 6, 6),
      setting("game", 5, 5),
      setting("calibration", 10, 4),
      setting("calibration", 9, 3),
    ];

    it("keeps the six most recently set bests on wide screens and the two latest on phones, games first", () => {
      renderWithIntl(<LabRecordSection record={record(EIGHT)} />);

      expect(rows()).toEqual([
        ["Game · 4 pieces · 10s", "wide"],
        ["Game · 4 pieces · 9s", "wide"],
        ["Game · 4 pieces · 8s", null],
        ["Game · 4 pieces · 7s", null],
        ["Game · 4 pieces · 6s", "narrow"],
        ["Game · 4 pieces · 5s", "narrow"],
        ["Practice · 4 pieces · 10s", "narrow"],
        ["Practice · 4 pieces · 9s", "narrow"],
      ]);
    });

    it("shows every setting on request and folds back to the default", () => {
      renderWithIntl(<LabRecordSection record={record(EIGHT)} />);
      const toggle = within(panel("Personal bests")).getByRole("button", { name: "Show all 8 settings" });
      const list = panel("Personal bests").querySelector(".lab-bests") as HTMLElement;

      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(toggle).toHaveAttribute("aria-controls", list.id);
      expect(toggle).not.toHaveAttribute("data-shown");

      fireEvent.click(toggle);

      expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(toggle).toHaveTextContent("Show fewer");
      expect(rows().map(([, older]) => older)).toEqual(Array(8).fill(null));

      fireEvent.click(toggle);

      expect(toggle).toHaveTextContent("Show all 8 settings");
      expect(rows().filter(([, older]) => older !== null)).toHaveLength(6);
    });

    it("offers the toggle on phones only when all the settings fit on a wider screen", () => {
      renderWithIntl(<LabRecordSection record={record([setting("game", 10, 3), setting("game", 9, 1), setting("calibration", 10, 2)])} />);

      expect(rows()).toEqual([
        ["Game · 4 pieces · 10s", null],
        ["Game · 4 pieces · 9s", "narrow"],
        ["Practice · 4 pieces · 10s", null],
      ]);
      expect(within(panel("Personal bests")).getByRole("button", { name: "Show all 3 settings" })).toHaveAttribute("data-shown", "narrow");
    });

    it("offers no toggle for two settings", () => {
      renderWithIntl(<LabRecordSection record={record([setting("game", 10, 1), setting("game", 9, 2)])} />);

      expect(within(panel("Personal bests")).queryByRole("button")).toBeNull();
    });
  });

  it("imports a file and reports what it added", async () => {
    const lab = record([]);
    const { container } = renderWithIntl(<LabRecordSection record={lab} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [new File(["{}"], "lab.json")] } });

    expect(await screen.findByText("Imported 3 rounds. 1 round in the file could not be read and was skipped.")).toBeInTheDocument();
  });

  it.each([
    [{ ok: true as const, added: 5000, rejected: 0, overCap: 2, summary: null }, "Imported 5,000 rounds. 2 older rounds were left out to stay within the 5,000-round limit."],
    [
      { ok: true as const, added: 4, rejected: 0, overCap: 0, summary: "ignored" as const },
      "Imported 4 rounds. This browser already had rounds, so only new rounds were merged, not the file's lifetime totals.",
    ],
    [{ ok: true as const, added: 0, rejected: 0, overCap: 0, summary: "ignored" as const }, "Nothing new to import. Those rounds are already here."],
    [{ ok: true as const, added: 0, rejected: 0, overCap: 0, summary: "dropped" as const }, "Nothing new to import. Those rounds are already here."],
    [
      { ok: true as const, added: 2, rejected: 0, overCap: 0, summary: "dropped" as const },
      "Imported 2 rounds. The file's lifetime totals could not be read, so only its rounds were imported.",
    ],
    [{ ok: true as const, added: 5000, rejected: 0, overCap: 0, summary: "restored" as const }, "Imported 5,000 rounds."],
    [{ ok: false as const, tooLarge: true }, "That file is over 5 MB, larger than any lab record, so nothing was imported."],
    [{ ok: false as const, tooLarge: false }, "That file is not a Memory Chess lab record."],
  ])("shows the import notice for %o", async (outcome, text) => {
    const { container } = renderWithIntl(<LabRecordSection record={record([], { importFile: jest.fn(() => Promise.resolve(outcome)) })} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [new File(["{}"], "lab.json")] } });

    expect(await screen.findByText(text)).toBeInTheDocument();
  });

  it("counts interest in cross-device backup without pretending it exists", () => {
    renderWithIntl(<LabRecordSection record={record(rounds(2, 1))} />);

    fireEvent.click(screen.getByRole("button", { name: "Back up across devices (coming soon)" }));

    expect(trackEvent).toHaveBeenCalledWith({ name: "lab_backup_interest", params: { rounds: 2 } });
    expect(screen.getByText(/not built yet/)).toBeInTheDocument();
  });

  it("names the last export without claiming a backup exists", () => {
    renderWithIntl(<LabRecordSection record={record([])} />);
    expect(screen.getByText("Not exported yet")).toBeInTheDocument();
  });

  it("says an export was started, since the browser may still ask to confirm the download", () => {
    renderWithIntl(<LabRecordSection record={record([], { lastBackup: Date.UTC(2026, 9, 7, 12) })} />);
    expect(screen.getByText(/^Export started /)).toBeInTheDocument();
  });

  describe("the Safari note", () => {
    const realAgent = navigator.userAgent;
    const useAgent = (agent: string) => Object.defineProperty(navigator, "userAgent", { value: agent, configurable: true });
    afterEach(() => useAgent(realAgent));

    it("tells Safari readers a private tab and a week away both lose the record", () => {
      useAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1");
      renderWithIntl(<LabRecordSection record={record([])} />);

      expect(screen.getByText(/a private tab does not keep this record after it closes/)).toHaveTextContent(/about 7 days/);
    });

    it("stays hidden on Chrome", () => {
      useAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0 Mobile/15E148 Safari/604.1");
      renderWithIntl(<LabRecordSection record={record([])} />);

      expect(screen.queryByText(/private tab/)).toBeNull();
    });
  });

  it("warns when this window cannot keep the record", () => {
    renderWithIntl(<LabRecordSection record={record([], { storage: "unavailable" })} />);

    expect(screen.getByText(/Not saved in private windows/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Download my lab record" })).toBeNull();
  });
});
