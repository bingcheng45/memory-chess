import { MICROSCOPE_PHASES, phaseNumber, SPECIMEN_SCORE } from "@/lib/home/specimen";
import { retentionNoReview, retentionWithReviews } from "@/lib/home/labRecord";

describe("microscope specimen", () => {
  it("reads 7 of 8 squares, 88%, under the real scoring rule", () => {
    expect(SPECIMEN_SCORE).toMatchObject({ accuracy: 88, correct: 7, total: 8, wrong: 1 });
  });
});

describe("microscope phase table", () => {
  it("lists the five phases in round order", () => {
    expect(MICROSCOPE_PHASES.map((phase) => phase.id)).toEqual(["study", "chunk", "blank", "rebuild", "score"]);
  });

  it("numbers each phase from its place in the table", () => {
    expect(MICROSCOPE_PHASES.map((phase) => phaseNumber(phase.id))).toEqual(["01", "02", "03", "04", "05"]);
    expect(phaseNumber("rebuild")).toBe("04");
  });

  it("shows the score chip only on the score phase", () => {
    expect(MICROSCOPE_PHASES.filter((phase) => phase.scoreChip).map((phase) => phase.id)).toEqual(["score"]);
  });
});

describe("illustrative forgetting curve", () => {
  it("restores retention to full at each review and fades slower after it", () => {
    expect(retentionWithReviews(3)).toBe(1);
    expect(retentionWithReviews(5)).toBeCloseTo(Math.exp(-2 / 7));
    expect(retentionNoReview(5)).toBeCloseTo(Math.exp(-5 / 1.4));
  });
});
