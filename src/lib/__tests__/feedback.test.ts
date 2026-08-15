import {
  createFeedbackSheetRow,
  feedbackSubmissionSchema,
} from "@/lib/feedback";

const validSubmission = {
  rating: 4,
  feedback: "The board felt clear and responsive.",
  accuracy: 87.5,
  correctPieces: 7,
  pieceCount: 8,
  difficulty: "custom" as const,
  memorizationTime: 8.2,
  solutionTime: 14.75,
};

describe("feedback submission", () => {
  it("accepts a valid anonymous response", () => {
    expect(feedbackSubmissionSchema.parse(validSubmission)).toEqual(
      validSubmission,
    );
  });

  it("requires a 1–5 star rating and limits written feedback", () => {
    expect(
      feedbackSubmissionSchema.safeParse({
        ...validSubmission,
        rating: 0,
      }).success,
    ).toBe(false);
    expect(
      feedbackSubmissionSchema.safeParse({
        ...validSubmission,
        feedback: "x".repeat(2_001),
      }).success,
    ).toBe(false);
  });

  it("maps feedback to the documented worksheet column order", () => {
    expect(
      createFeedbackSheetRow(
        validSubmission,
        "2026-08-16T04:00:00.000Z",
        "1.2.0",
      ),
    ).toEqual([
      "2026-08-16T04:00:00.000Z",
      4,
      "The board felt clear and responsive.",
      87.5,
      7,
      8,
      "custom",
      8.2,
      14.75,
      "1.2.0",
    ]);
  });
});
