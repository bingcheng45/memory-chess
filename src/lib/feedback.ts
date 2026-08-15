import { z } from "zod";

export const FEEDBACK_MAX_LENGTH = 2_000;

export const feedbackSubmissionSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().trim().max(FEEDBACK_MAX_LENGTH).optional().default(""),
  accuracy: z.number().min(0).max(100),
  correctPieces: z.number().int().min(0).max(32),
  pieceCount: z.number().int().min(2).max(32),
  difficulty: z.enum(["easy", "medium", "hard", "grandmaster", "custom"]),
  memorizationTime: z.number().min(0).max(86_400),
  solutionTime: z.number().min(0).max(86_400),
});

export type FeedbackSubmission = z.infer<typeof feedbackSubmissionSchema>;

export function createFeedbackSheetRow(
  submission: FeedbackSubmission,
  submittedAt: string,
  appVersion: string,
): readonly (string | number)[] {
  return [
    submittedAt,
    submission.rating,
    submission.feedback,
    submission.accuracy,
    submission.correctPieces,
    submission.pieceCount,
    submission.difficulty,
    submission.memorizationTime,
    submission.solutionTime,
    appVersion,
  ];
}
