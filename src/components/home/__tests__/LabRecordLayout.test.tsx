import { renderWithIntl } from "@/test-utils/intl";
import { LabRecordSection } from "@/components/home/LabRecordSection";
import type { LabRecord } from "@/components/home/useLabRecord";
import { PANEL_ORDER } from "@/lib/lab/panels";
import { EMPTY_SUMMARY } from "@/lib/lab/summary";

jest.mock("@/lib/analytics/events", () => ({ trackEvent: jest.fn() }));

const newVisitor: LabRecord = {
  storage: "available",
  records: [],
  summary: EMPTY_SUMMARY,
  lastBackup: null,
  today: "",
  download: jest.fn(() => Promise.resolve()),
  importFile: jest.fn(() => Promise.resolve({ ok: true as const, added: 0, rejected: 0, overCap: 0, summary: null })),
};

describe("§06 layout", () => {
  it("reads row by row, from the reading to the tools, with the unlock strip above", () => {
    const { container } = renderWithIntl(<LabRecordSection record={newVisitor} />);

    const blocks = [...container.querySelectorAll(".lab-unlock, [data-row]")].map((block) => block.getAttribute("data-row") ?? "unlock");

    expect(blocks).toEqual(["unlock", "reading", "habit", "diagnosis", "programs", "compare", "tools"]);
  });

  it("numbers every figure from its place in the reading order", () => {
    const { container } = renderWithIntl(<LabRecordSection record={newVisitor} />);

    const figures = [...container.querySelectorAll(".lab-panel .lab-panel-h > .lab-k")].map((fig) => fig.textContent);

    expect(figures).toEqual([
      "Fig. 1 · Memory span",
      "Fig. 2 · Pieces held",
      "Fig. 3 · Accuracy over time",
      "Fig. 4 · Recall pace",
      "Fig. 5 · Today's board",
      "Fig. 6 · Days in a row",
      "Fig. 7 · Forgetting curve",
      "Fig. 8 · Lab notebook",
      "Fig. 9 · Miss map",
      "Fig. 10 · Recall by piece type",
      "Fig. 11 · Insights",
      "Fig. 12 · Programs",
      "Fig. 13 · Goal",
      "Fig. 14 · Personal bests",
      "Fig. 15 · Leaderboard",
    ]);
  });

  it("renders every panel of the section map once, in order, so no row can drop one", () => {
    const { container } = renderWithIntl(<LabRecordSection record={newVisitor} />);

    const panels = [...container.querySelectorAll(".lab-panel .lab-panel-h > .lab-k")].map((fig) => Number(fig.textContent!.match(/^Fig\. (\d+) /)![1]));

    expect(panels).toEqual(PANEL_ORDER.map((_, index) => index + 1));
  });
});
