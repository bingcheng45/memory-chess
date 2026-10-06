import { SPECIMEN_SCORE } from "@/lib/home/specimen";
import { retentionNoReview, retentionWithReviews } from "@/lib/home/labRecord";

describe("microscope specimen", () => {
  it("reads 7 of 8 squares, 88%, under the real scoring rule", () => {
    expect(SPECIMEN_SCORE).toMatchObject({ accuracy: 88, correct: 7, total: 8, wrong: 1 });
  });
});

describe("illustrative forgetting curve", () => {
  it("restores retention to full at each review and fades slower after it", () => {
    expect(retentionWithReviews(3)).toBe(1);
    expect(retentionWithReviews(5)).toBeCloseTo(Math.exp(-2 / 7));
    expect(retentionNoReview(5)).toBeCloseTo(Math.exp(-5 / 1.4));
  });
});
