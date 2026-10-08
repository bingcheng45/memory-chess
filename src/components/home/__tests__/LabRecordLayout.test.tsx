import { renderWithIntl } from "@/test-utils/intl";
import { LabRecordSection } from "@/components/home/LabRecordSection";
import type { LabRecord } from "@/components/home/useLabRecord";
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
      "Fig. 6.1 · Accuracy over time",
      "Fig. 6.2 · Days in a row",
      "Fig. 6.3 · Forgetting curve",
      "Fig. 6.4 · Miss map",
      "Fig. 6.5 · Recall by piece type",
      "Fig. 6.6 · Personal bests",
      "Fig. 6.7 · Leaderboard",
    ]);
  });
});
