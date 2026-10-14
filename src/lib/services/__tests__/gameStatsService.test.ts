/** @jest-environment node */

import { incrementGameMetric } from "@/lib/services/gameStatsService";

jest.mock("@/lib/supabase", () => {
  const rpc = jest.fn();
  const from = jest.fn();
  return {
    supabase: { from, rpc },
    supabaseWriter: { from, rpc },
    SUPABASE_WRITES_OFF_REASON: "Supabase is not configured",
    checkSupabaseConnection: async () => ({ connected: true }),
    stub: { rpc, from },
  };
});

const { stub } = jest.requireMock("@/lib/supabase") as { stub: { rpc: jest.Mock; from: jest.Mock } };

const RLS_ERROR = {
  code: "42501",
  details: null,
  hint: null,
  message: 'new row violates row-level security policy for table "game_stats"',
};

let logged: jest.SpyInstance;

beforeEach(() => {
  stub.rpc.mockReset();
  stub.from.mockReset();
  logged = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  logged.mockRestore();
});

describe("incrementGameMetric", () => {
  it("asks increment_metric for one more play and answers the new total", async () => {
    stub.rpc.mockResolvedValue({ data: 1043, error: null });

    const result = await incrementGameMetric("total_plays", 1);

    expect(result).toEqual({ success: true, newValue: 1043 });
    expect(stub.rpc.mock.calls).toEqual([["increment_metric", { p_metric_name: "total_plays", p_increment: 1 }]]);
  });

  it("answers the database's refusal and writes nothing else", async () => {
    stub.rpc.mockResolvedValue({ data: null, error: RLS_ERROR });

    const result = await incrementGameMetric("total_plays", 1);

    expect(result).toEqual({
      success: false,
      error: 'Failed to increment metric: new row violates row-level security policy for table "game_stats"',
    });
    expect(stub.from).not.toHaveBeenCalled();
    expect(logged.mock.calls).toEqual([["Error incrementing metric total_plays:", RLS_ERROR]]);
  });
});
