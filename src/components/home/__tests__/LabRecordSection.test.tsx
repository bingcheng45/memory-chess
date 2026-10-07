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
    importFile: jest.fn(() => Promise.resolve({ ok: true as const, added: 3, rejected: 1, overCap: 0 })),
    ...overrides,
  };
}

const panel = (fig: RegExp) => screen.getByText(fig).closest(".lab-panel") as HTMLElement;

describe("LabRecordSection", () => {
  it("shows the sample panels, tagged Sample, before any round is played", () => {
    renderWithIntl(<LabRecordSection record={record([])} />);

    expect(within(panel(/Fig. 6.2/)).getByText("Sample")).toBeInTheDocument();
    expect(within(panel(/Fig. 6.3/)).getByText("Sample")).toBeInTheDocument();
    expect(within(panel(/Fig. 6.4/)).getByText("Sample")).toBeInTheDocument();
    expect(within(panel(/Fig. 6.1/)).getByText("Illustrative")).toBeInTheDocument();
    expect(within(panel(/Fig. 6.6/)).getByText(/appears after your first round/)).toBeInTheDocument();
  });

  it("says how many more rounds each panel needs below its threshold", () => {
    renderWithIntl(<LabRecordSection record={record(rounds(2, 1))} />);

    expect(within(panel(/Fig. 6.2/)).getByText("3 more rounds at 4 pieces, 10s draws your trend.")).toBeInTheDocument();
    expect(within(panel(/Fig. 6.4/)).getByText("Play on one more day to start a streak.")).toBeInTheDocument();
    expect(within(panel(/Fig. 6.7/)).getByText("About 8 more rounds until a piece type has 20 sightings.")).toBeInTheDocument();
    expect(within(panel(/Fig. 6.6/)).getByText("Game · 4 pieces · 10s")).toBeInTheDocument();
    expect(within(panel(/Fig. 6.6/)).getByText("100% · rebuilt in 15.0s")).toBeInTheDocument();
  });

  it("draws the player's own record once there is enough", () => {
    renderWithIntl(<LabRecordSection record={record(rounds(10, 3))} />);

    expect(within(panel(/Fig. 6.2/)).getByText(/From 10 rounds/)).toBeInTheDocument();
    expect(within(panel(/Fig. 6.2/)).getByRole("img")).toHaveAccessibleName(
      "Your accuracy over your last 10 rounds at 4 pieces and 10 seconds, latest 50 percent.",
    );
    expect(within(panel(/Fig. 6.4/)).getByText(/Current streak 3 days · longest 3 days/)).toBeInTheDocument();
    expect(within(panel(/Fig. 6.7/)).getByText("King")).toBeInTheDocument();
    expect(within(panel(/Fig. 6.7/)).getByText("100%")).toBeInTheDocument();
    expect(within(panel(/Fig. 6.7/)).getAllByText("10/20 seen")).toHaveLength(2);
    expect(within(panel(/Fig. 6.7/)).queryByText("Pawn")).toBeNull();
  });

  it("labels practice bests apart from game bests at the same setting", () => {
    const practice = buildRoundRecord({ ...rounds(1, 1)[0], id: "p", source: "calibration", pieceCount: 4, memorizeSeconds: 10, solveMs: 9000 });
    renderWithIntl(<LabRecordSection record={record([...rounds(2, 1), practice])} />);

    expect(within(panel(/Fig. 6.6/)).getByText("Game · 4 pieces · 10s")).toBeInTheDocument();
    expect(within(panel(/Fig. 6.6/)).getByText("Practice · 4 pieces · 10s")).toBeInTheDocument();
    expect(within(panel(/Fig. 6.6/)).getByText("100% · rebuilt in 9.0s")).toBeInTheDocument();
  });

  it("imports a file and reports what it added", async () => {
    const lab = record([]);
    const { container } = renderWithIntl(<LabRecordSection record={lab} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [new File(["{}"], "lab.json")] } });

    expect(await screen.findByText("Imported 3 rounds. 1 round in the file could not be read and was skipped.")).toBeInTheDocument();
  });

  it.each([
    [{ ok: true as const, added: 5000, rejected: 0, overCap: 2 }, "Imported 5,000 rounds. 2 older rounds were left out to stay within the 5,000-round limit."],
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
