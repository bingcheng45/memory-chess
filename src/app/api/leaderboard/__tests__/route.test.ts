/** @jest-environment node */

import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/leaderboard/route";
import { getDailyResults, getLeaderboard, submitLeaderboardEntry } from "@/lib/services/leaderboardService";
import { checkSupabaseConnection } from "@/lib/supabase";
import { WORLD_CODE } from "@/lib/leaderboard/countries";

jest.mock("@/lib/services/leaderboardService", () => ({
  getDailyResults: jest.fn(),
  getLeaderboard: jest.fn(),
  submitLeaderboardEntry: jest.fn(),
}));

jest.mock("@/lib/supabase", () => ({
  checkSupabaseConnection: jest.fn(),
}));

const validEntry = {
  player_name: "Dino beta",
  difficulty: "medium",
  piece_count: 6,
  correct_pieces: 4,
  memorize_time: 8.25,
  solution_time: 12.5,
  total_wrong_pieces: 2,
  skill_rating: 1240,
};

let nextAddress = 0;
const freshAddress = () => `198.51.100.${(nextAddress += 1)}`;

function post(body: object, address = freshAddress()) {
  return POST(
    new NextRequest("http://localhost/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": address },
      body: JSON.stringify(body),
    }),
  );
}

const storedRow = { id: 1, ...validEntry, country_code: WORLD_CODE };

describe("POST /api/leaderboard", () => {
  let logged: jest.SpyInstance;

  beforeEach(() => {
    jest.mocked(checkSupabaseConnection).mockReset().mockResolvedValue({ connected: true });
    jest
      .mocked(submitLeaderboardEntry)
      .mockReset()
      .mockResolvedValue({ status: "stored", entry: storedRow } as never);
    logged = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    logged.mockRestore();
  });

  it("stores a round with at least one correct piece", async () => {
    const response = await post(validEntry);

    expect(response.status).toBe(200);
    expect(submitLeaderboardEntry).toHaveBeenCalledWith({ ...validEntry, country_code: WORLD_CODE });
  });

  it("takes five scores a minute from one address and refuses the sixth with a Retry-After", async () => {
    const address = freshAddress();
    const statuses = [];
    for (let score = 0; score < 5; score += 1) statuses.push((await post(validEntry, address)).status);
    const refused = await post(validEntry, address);
    const other = await post(validEntry);

    expect(statuses).toEqual([200, 200, 200, 200, 200]);
    expect([refused.status, refused.headers.get("Retry-After"), await refused.json(), other.status]).toEqual([
      429,
      "60",
      { error: "Too many scores submitted. Please wait a minute." },
      200,
    ]);
    expect(submitLeaderboardEntry).toHaveBeenCalledTimes(6);
  });

  it("rejects a round with no correct piece, which the board would never show", async () => {
    const response = await post({ ...validEntry, correct_pieces: 0 });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid data values" });
    expect(submitLeaderboardEntry).not.toHaveBeenCalled();
  });

  it.each([
    ["a negative wrong count", { total_wrong_pieces: -5 }],
    ["no wrong count", { total_wrong_pieces: undefined }],
    ["a null wrong count", { total_wrong_pieces: null }],
    ["a fractional wrong count", { total_wrong_pieces: 2.5 }],
    ["a wrong count as text", { total_wrong_pieces: "2" }],
    ["fewer wrong than the 2 pieces it missed", { total_wrong_pieces: 1 }],
    ["more wrong than 64 squares leave beside 4 correct", { total_wrong_pieces: 61 }],
    ["a fractional correct count", { correct_pieces: 3.5 }],
    ["a correct count as text", { correct_pieces: "4" }],
    ["more correct than the board's 6 pieces", { correct_pieces: 7, total_wrong_pieces: 0 }],
  ])("rejects a round with %s", async (_case, counts) => {
    const response = await post({ ...validEntry, ...counts });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid data values" });
    expect(submitLeaderboardEntry).not.toHaveBeenCalled();
  });

  it.each([
    ["only the 2 pieces it missed", 2],
    ["a piece on every other square of the board", 60],
  ])("stores a round of 4 correct out of 6 with %s wrong", async (_case, total_wrong_pieces) => {
    const response = await post({ ...validEntry, total_wrong_pieces });

    expect(response.status).toBe(200);
    expect(submitLeaderboardEntry).toHaveBeenCalledWith(expect.objectContaining({ total_wrong_pieces }));
  });

  it("forwards a known country code to the service", async () => {
    const response = await post({ ...validEntry, country_code: "SG" });

    expect(response.status).toBe(200);
    expect(submitLeaderboardEntry).toHaveBeenCalledWith(expect.objectContaining({ country_code: "SG" }));
  });

  it("submits the world code when the body carries no country at all", async () => {
    const response = await post(validEntry);

    expect(response.status).toBe(200);
    expect(submitLeaderboardEntry).toHaveBeenCalledWith(expect.objectContaining({ country_code: "ZZ" }));
  });

  it("submits the world code when the body carries an explicit null country", async () => {
    const response = await post({ ...validEntry, country_code: null });

    expect(response.status).toBe(200);
    expect(submitLeaderboardEntry).toHaveBeenCalledWith(expect.objectContaining({ country_code: "ZZ" }));
  });

  it("rejects a country code that is not a known code", async () => {
    const response = await post({ ...validEntry, country_code: "qq" });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid country code" });
    expect(submitLeaderboardEntry).not.toHaveBeenCalled();
  });

  it("tells the player to come back shortly when the store cannot take the score", async () => {
    const cause = { code: "PGRST204", message: "column missing" };
    jest
      .mocked(submitLeaderboardEntry)
      .mockResolvedValue({ status: "unavailable", cause } as never);

    const response = await post(validEntry);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "The leaderboard is being updated. Please try again shortly.",
    });
    expect(logged).toHaveBeenCalledWith(expect.stringContaining("unavailable"), cause);
  });

  it("logs the underlying cause behind a 500 so the failure is diagnosable", async () => {
    const cause = {
      code: "23505",
      message: 'duplicate key value violates unique constraint "leaderboard_entries_pkey"',
    };
    jest.mocked(submitLeaderboardEntry).mockResolvedValue({ status: "failed", cause } as never);

    const response = await post(validEntry);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "An unexpected error occurred" });
    expect(logged).toHaveBeenCalledWith(expect.stringContaining("failed"), cause);
  });

  it("answers a service-side validation failure with its own message and a 400", async () => {
    jest.mocked(submitLeaderboardEntry).mockResolvedValue({
      status: "invalid",
      message: "Player name must be between 4 and 16 characters",
    } as never);

    const response = await post(validEntry);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Player name must be between 4 and 16 characters",
    });
  });

  it.each([
    ["negative", -1],
    ["fractional", 12.5],
    ["a string", "1200"],
    ["null", null],
  ])("rejects a skill rating that is %s", async (_case, skill_rating) => {
    const response = await post({ ...validEntry, skill_rating });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid skill rating" });
    expect(submitLeaderboardEntry).not.toHaveBeenCalled();
  });

  it.each([
    ["the lowest rating", 0, 0],
    ["the highest rating", 5000, 5000],
    ["a rating above the highest as the highest", 7300, 5000],
  ])("stores %s", async (_case, sent, stored) => {
    const response = await post({ ...validEntry, skill_rating: sent });

    expect(response.status).toBe(200);
    expect(submitLeaderboardEntry).toHaveBeenCalledWith(expect.objectContaining({ skill_rating: stored }));
  });

  it("stores the starting rating for a tab that sends none", async () => {
    const response = await post({ ...validEntry, skill_rating: undefined });

    expect(response.status).toBe(200);
    expect(submitLeaderboardEntry).toHaveBeenCalledWith(expect.objectContaining({ skill_rating: 1000 }));
  });

  it("hands the rating to the insert unchanged", async () => {
    await post(validEntry);

    expect(submitLeaderboardEntry).toHaveBeenCalledWith({
      player_name: "Dino beta",
      difficulty: "medium",
      piece_count: 6,
      correct_pieces: 4,
      memorize_time: 8.25,
      solution_time: 12.5,
      total_wrong_pieces: 2,
      skill_rating: 1240,
      country_code: "ZZ",
    });
  });

  it.each([
    ["a number", 123],
    ["an array", []],
    ["an object", {}],
  ])("rejects a player name that is %s, not text", async (_case, player_name) => {
    const response = await post({ ...validEntry, player_name });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Player name must be text" });
    expect(submitLeaderboardEntry).not.toHaveBeenCalled();
  });

  it("measures the name without its spaces, so \"  ab  \" is two characters and refused", async () => {
    const response = await post({ ...validEntry, player_name: "  ab  " });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Player name must be between 4 and 16 characters" });
    expect(submitLeaderboardEntry).not.toHaveBeenCalled();
  });

  it("counts a name of three emoji as three characters, as Postgres does, and refuses it", async () => {
    const response = await post({ ...validEntry, player_name: "\u{1F600}\u{1F600}\u{1F600}" });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Player name must be between 4 and 16 characters" });
    expect(submitLeaderboardEntry).not.toHaveBeenCalled();
  });

  it("counts a name of nine emoji as nine characters and stores it", async () => {
    const response = await post({ ...validEntry, player_name: "\u{1F600}".repeat(9) });

    expect(response.status).toBe(200);
    expect(jest.mocked(submitLeaderboardEntry).mock.calls[0][0]).toMatchObject({ player_name: "\u{1F600}".repeat(9) });
  });

  it("stores the name without its surrounding spaces", async () => {
    await post({ ...validEntry, player_name: "  Poteto  " });

    expect(jest.mocked(submitLeaderboardEntry).mock.calls[0][0]).toMatchObject({ player_name: "Poteto" });
  });

  describe("on 2026-10-13 at 00:30 UTC", () => {
    beforeEach(() => {
      jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-13T00:30:00Z"));
    });

    afterEach(() => {
      jest.mocked(Date.now).mockRestore();
    });

    it.each([
      ["2026-10-13", 6, 10],
      ["2026-10-12", 5, 12],
    ])("stores a daily row for %s, today or yesterday in UTC, at that day's %i pieces and %i seconds", async (day, pieces, seconds) => {
      const response = await post({ ...validEntry, difficulty: "daily", daily_day: day, piece_count: pieces, memorize_time: seconds, country_code: "SG" });

      expect(response.status).toBe(200);
      expect(submitLeaderboardEntry).toHaveBeenCalledWith(
        expect.objectContaining({ difficulty: "daily", daily_day: day }),
      );
    });

    it.each([
      ["yesterday's pieces and seconds", { piece_count: 5, memorize_time: 12 }],
      ["today's seconds with another piece count", { piece_count: 5, memorize_time: 10 }],
      ["today's pieces with the seconds actually studied", { piece_count: 6, memorize_time: 8.25 }],
    ])("rejects a row for today, 6 pieces and 10 seconds, sent with %s", async (_case, setting) => {
      const response = await post({ ...validEntry, difficulty: "daily", daily_day: "2026-10-13", country_code: "SG", ...setting });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "The daily board for 2026-10-13 is 6 pieces and 10 seconds" });
      expect(submitLeaderboardEntry).not.toHaveBeenCalled();
    });

    it.each([
      ["no country", {}],
      ["the world", { country_code: "ZZ" }],
    ])("rejects a daily row for today sent with %s, since the daily board ranks countries", async (_case, country) => {
      const response = await post({ ...validEntry, difficulty: "daily", daily_day: "2026-10-13", piece_count: 6, memorize_time: 10, ...country });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "A daily row needs a country" });
      expect(submitLeaderboardEntry).not.toHaveBeenCalled();
    });

    const todaysRow = { ...validEntry, difficulty: "daily", daily_day: "2026-10-13", piece_count: 6, memorize_time: 10, country_code: "SG" };

    it("rejects a daily rebuild of 6 pieces in 1.49 s, under a quarter second a piece", async () => {
      const response = await post({ ...todaysRow, solution_time: 1.49 });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "A daily rebuild of 6 pieces takes at least 1.5 seconds" });
      expect(submitLeaderboardEntry).not.toHaveBeenCalled();
    });

    it.each([
      ["the text \"0.01\"", "0.01"],
      ["the text \"12.5\"", "12.5"],
      ["an array", [12.5]],
    ])("rejects a daily rebuild time sent as %s, not a number", async (_case, solution_time) => {
      const response = await post({ ...todaysRow, solution_time });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "A daily rebuild of 6 pieces takes at least 1.5 seconds" });
      expect(submitLeaderboardEntry).not.toHaveBeenCalled();
    });

    it.each([
      ["pieces as the text \"6\"", { piece_count: "6" }],
      ["seconds as the text \"10\"", { memorize_time: "10" }],
    ])("rejects a daily row for today with its %s", async (_case, setting) => {
      const response = await post({ ...todaysRow, ...setting });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "The daily board for 2026-10-13 is 6 pieces and 10 seconds" });
      expect(submitLeaderboardEntry).not.toHaveBeenCalled();
    });

    it("rejects a daily row with a negative wrong count, which would top the board", async () => {
      const response = await post({ ...todaysRow, total_wrong_pieces: -1 });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid data values" });
      expect(submitLeaderboardEntry).not.toHaveBeenCalled();
    });

    it("stores a daily rebuild of 6 pieces in 1.5 s, exactly a quarter second a piece", async () => {
      const response = await post({ ...todaysRow, solution_time: 1.5 });

      expect(response.status).toBe(200);
      expect(submitLeaderboardEntry).toHaveBeenCalledWith(expect.objectContaining({ daily_day: "2026-10-13", solution_time: 1.5 }));
    });

    it.each(["2026-10-14", "2026-10-11", "9999-12-31", "0000-01-01"])("rejects a daily row for %s", async (day) => {
      const response = await post({ ...validEntry, difficulty: "daily", daily_day: day });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid difficulty or daily day" });
      expect(submitLeaderboardEntry).not.toHaveBeenCalled();
    });
  });

  it.each([
    ["no day", { difficulty: "daily" }],
    ["a null day", { difficulty: "daily", daily_day: null }],
    ["a day that does not exist", { difficulty: "daily", daily_day: "2026-02-30" }],
    ["a timestamp instead of a day", { difficulty: "daily", daily_day: "2026-10-13T00:00:00Z" }],
    ["a medium row carrying a day", { difficulty: "medium", daily_day: "2026-10-13" }],
  ])("rejects %s", async (_case, board) => {
    const response = await post({ ...validEntry, ...board });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid difficulty or daily day" });
    expect(submitLeaderboardEntry).not.toHaveBeenCalled();
  });

  it("sends no daily day for a board row whose body carries an explicit null", async () => {
    await post({ ...validEntry, daily_day: null });

    expect(jest.mocked(submitLeaderboardEntry).mock.calls[0][0]).not.toHaveProperty("daily_day");
  });

  it("rejects a board that does not exist", async () => {
    const response = await post({ ...validEntry, difficulty: "weekly" });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid difficulty or daily day" });
  });
});

describe("GET /api/leaderboard", () => {
  beforeEach(() => {
    jest.mocked(checkSupabaseConnection).mockResolvedValue({ connected: true });
    jest.mocked(getLeaderboard).mockResolvedValue({ data: [] });
    jest.mocked(getDailyResults).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const get = (difficulty: string) =>
    GET(new NextRequest(`http://localhost/api/leaderboard?difficulty=${difficulty}`));

  it.each(["easy", "medium", "hard", "grandmaster"])("reads the %s board", async (difficulty) => {
    const response = await get(difficulty);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: [] });
    expect(getLeaderboard).toHaveBeenCalledWith({ difficulty });
  });

  describe("on 2026-10-13 at 00:30 UTC", () => {
    beforeEach(() => jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-13T00:30:00Z")));
    afterEach(() => jest.mocked(Date.now).mockRestore());

    it.each([
      ["no day, which reads as today", "", "2026-10-13"],
      ["today", "&daily_day=2026-10-13", "2026-10-13"],
      ["yesterday, still open to late rounds", "&daily_day=2026-10-12", "2026-10-12"],
    ])("reads the daily board of %s", async (_case, query, day) => {
      const response = await get(`daily${query}`);

      expect(response.status).toBe(200);
      expect(getLeaderboard).toHaveBeenCalledWith({ difficulty: "daily", daily_day: day });
    });

    const results = (count: number) =>
      Array.from({ length: count }, (_, index) =>
        index % 2
          ? { piece_count: 6, correct_pieces: 5, total_wrong_pieces: 1, skill_rating: 1400 }
          : { piece_count: 6, correct_pieces: 4, total_wrong_pieces: 2, skill_rating: 1400 },
      );

    it("says how today's board played once 25 players have joined it", async () => {
      jest.mocked(getDailyResults).mockResolvedValue(results(30));

      const response = await get("daily");

      expect(await response.json()).toEqual({ data: [], playedLike: 1180 });
      expect(getDailyResults).toHaveBeenCalledWith("2026-10-13");
    });

    it("says nothing of how the board played before 25 players have joined it", async () => {
      jest.mocked(getDailyResults).mockResolvedValue(results(24));

      expect(await (await get("daily")).json()).toEqual({ data: [], playedLike: null });
    });

    it("still answers with the board when the results cannot be read", async () => {
      jest.mocked(getDailyResults).mockResolvedValue(null);

      const response = await get("daily");

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ data: [], playedLike: null });
    });

    it.each(["2026-10-11", "2026-10-14", "2026-02-30"])("refuses the daily board of %s, outside the days a row can join", async (day) => {
      const response = await get(`daily&daily_day=${day}`);

      expect(response.status).toBe(400);
      expect(getLeaderboard).not.toHaveBeenCalled();
    });
  });

  it.each([
    ["23:56, four minutes before midnight, for a viewer whose clock has already passed it, with 200", "2026-10-13T23:56:00Z", 200],
    ["12:00, far from midnight, with 400", "2026-10-13T12:00:00Z", 400],
  ])("answers a read of tomorrow's daily board at %s", async (_case, now, status) => {
    jest.spyOn(Date, "now").mockReturnValue(Date.parse(now));

    const response = await get("daily&daily_day=2026-10-14");
    jest.mocked(Date.now).mockRestore();

    expect(response.status).toBe(status);
  });

  it("still refuses a row for tomorrow's daily board at 23:56", async () => {
    jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-13T23:56:00Z"));

    const response = await post({ ...validEntry, difficulty: "daily", daily_day: "2026-10-14", piece_count: 6, memorize_time: 10, country_code: "SG" });
    jest.mocked(Date.now).mockRestore();

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid difficulty or daily day" });
  });

  it.each(["weekly", "custom"])("rejects the %s board, which it does not serve", async (difficulty) => {
    const response = await get(difficulty);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid difficulty level" });
    expect(getLeaderboard).not.toHaveBeenCalled();
  });

  describe("when the database fails", () => {
    let logged: jest.SpyInstance;
    beforeEach(() => {
      logged = jest.spyOn(console, "error").mockImplementation(() => {});
      jest.spyOn(console, "warn").mockImplementation(() => {});
    });
    afterEach(() => jest.restoreAllMocks());

    const unavailable = { data: [], error: "The leaderboard is unavailable. Please try again shortly." };

    it("answers a failed query with 503 and a generic message, not the database's words", async () => {
      jest.mocked(getLeaderboard).mockResolvedValue({ data: [], error: 'Database query failed: relation "leaderboard_entries" does not exist' });

      const response = await get("medium");

      expect([response.status, await response.json()]).toEqual([503, unavailable]);
    });

    it("answers a refused connection with 503 and logs its cause", async () => {
      jest.mocked(checkSupabaseConnection).mockResolvedValue({ connected: false, error: "password authentication failed for user app" });

      const response = await get("medium");

      expect([response.status, await response.json()]).toEqual([503, unavailable]);
      expect(console.warn).toHaveBeenCalledWith("Supabase connection issue:", "password authentication failed for user app");
    });

    it("answers a thrown read with 503 and logs the error", async () => {
      const thrown = new Error("connect ECONNREFUSED 10.0.0.3:5432");
      jest.mocked(getLeaderboard).mockRejectedValue(thrown);

      const response = await get("medium");

      expect([response.status, await response.json()]).toEqual([503, unavailable]);
      expect(logged).toHaveBeenCalledWith("Unexpected API error:", thrown);
    });
  });
});
