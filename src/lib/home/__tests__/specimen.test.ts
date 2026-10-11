import { MICROSCOPE_PHASES, phaseNumber, SPECIMEN_SCORE } from "@/lib/home/specimen";
import { retentionNoReview, retentionWithReviews } from "@/lib/home/labRecord";

describe("microscope specimen", () => {
  it("reads 10 of 11 squares, 91%, under the real scoring rule", () => {
    expect(SPECIMEN_SCORE).toMatchObject({ accuracy: 91, correct: 10, total: 11, wrong: 1 });
  });
});

describe("microscope phase table", () => {
  it("numbers each phase from its place in round order", () => {
    expect(MICROSCOPE_PHASES.map((phase) => `${phaseNumber(phase.id)} ${phase.id}`)).toEqual([
      "01 study",
      "02 anchors",
      "03 chunk",
      "04 encode",
      "05 blank",
      "06 rebuild",
      "07 score",
    ]);
  });

  it("shows the score chip only on the score phase", () => {
    expect(MICROSCOPE_PHASES.filter((phase) => phase.scoreChip).map((phase) => phase.id)).toEqual(["score"]);
  });

  it("grades squares only once the round is scored", () => {
    expect(MICROSCOPE_PHASES.filter((phase) => phase.marks).map((phase) => phase.id)).toEqual(["score"]);
    expect(MICROSCOPE_PHASES.find((phase) => phase.id === "rebuild")).toMatchObject({ marks: false, pieces: "recall" });
  });
});

describe("illustrative forgetting curve", () => {
  it("restores retention to full at each review and fades slower after it", () => {
    expect(retentionWithReviews(3)).toBe(1);
    expect(retentionWithReviews(5)).toBeCloseTo(Math.exp(-2 / 7));
    expect(retentionNoReview(5)).toBeCloseTo(Math.exp(-5 / 1.4));
  });
});
