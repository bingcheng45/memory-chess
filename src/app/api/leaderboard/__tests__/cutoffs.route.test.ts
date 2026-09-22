/** @jest-environment node */

import { GET } from "@/app/api/leaderboard/cutoffs/route";
import { getLeaderboardCutoffs } from "@/lib/services/leaderboardService";
import type { BoardCutoff, LeaderboardCutoffs } from "@/lib/leaderboard/ranking";

jest.mock("@/lib/services/leaderboardService", () => ({
  getLeaderboardCutoffs: jest.fn(),
}));

const easyCutoff: BoardCutoff = {
  kind: "full",
  worst: { correctPieces: 2, totalWrongPieces: 0, memorizeTime: 3.917, solutionTime: 5.567 },
};

const fullBoards: LeaderboardCutoffs = {
  easy: easyCutoff,
  medium: {
    kind: "full",
    worst: { correctPieces: 4, totalWrongPieces: 2, memorizeTime: 8.25, solutionTime: 12.5 },
  },
  hard: {
    kind: "full",
    worst: { correctPieces: 5, totalWrongPieces: 3, memorizeTime: 15.4, solutionTime: 24.1 },
  },
  grandmaster: {
    kind: "full",
    worst: { correctPieces: 6, totalWrongPieces: null, memorizeTime: 21.8, solutionTime: 39.05 },
  },
};

const mixedBoards: LeaderboardCutoffs = {
  easy: easyCutoff,
  medium: { kind: "open" },
  hard: { kind: "open" },
  grandmaster: { kind: "open" },
};

describe("GET /api/leaderboard/cutoffs", () => {
  let logged: jest.SpyInstance;

  beforeEach(() => {
    jest.mocked(getLeaderboardCutoffs).mockReset().mockResolvedValue(fullBoards);
    logged = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    logged.mockRestore();
  });

  it("answers a cutoff for every difficulty when all four boards are full", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: fullBoards });
  });

  it("keeps open and full boards apart in the same answer", async () => {
    jest.mocked(getLeaderboardCutoffs).mockResolvedValue(mixedBoards);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: mixedBoards });
  });

  it("answers unknown cutoffs as null data rather than as a failure status", async () => {
    jest.mocked(getLeaderboardCutoffs).mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: null });
  });

  it("still answers 200 when the service throws, and logs what threw", async () => {
    const cause = new Error("supabase unreachable");
    jest.mocked(getLeaderboardCutoffs).mockRejectedValue(cause);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: null });
    expect(logged).toHaveBeenCalledWith(expect.stringContaining("cutoffs"), cause);
  });
});
