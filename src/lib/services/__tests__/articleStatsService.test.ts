/** @jest-environment node */

import { NO_ARTICLE_STATS } from "@/lib/articles/stats";
import { getArticleStats, recordArticleEvent } from "@/lib/services/articleStatsService";

jest.mock("@/lib/supabase", () => {
  const readAnswer = jest.fn();
  const inFilter = jest.fn(() => ({ abortSignal: readAnswer }));
  const select = jest.fn(() => ({ in: inFilter }));
  const from = jest.fn(() => ({ select }));
  const rpcAnswer = jest.fn();
  const rpc = jest.fn(() => ({ abortSignal: rpcAnswer }));
  const stub = { isConfigured: true, from, select, inFilter, readAnswer, rpc, rpcAnswer };

  return {
    get supabase() {
      return stub.isConfigured ? { from, rpc } : null;
    },
    stub,
  };
});

const { stub } = jest.requireMock("@/lib/supabase") as {
  stub: {
    isConfigured: boolean;
    from: jest.Mock;
    select: jest.Mock;
    inFilter: jest.Mock;
    readAnswer: jest.Mock;
    rpc: jest.Mock;
    rpcAnswer: jest.Mock;
  };
};

const SLUGS = ["magnus-carlsen", "judit-polgar"];
const POSTGREST_ERROR = { code: "42501", details: null, hint: null, message: "permission denied" };

let logged: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  stub.readAnswer.mockReset();
  stub.rpcAnswer.mockReset();
  stub.isConfigured = true;
  logged = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  logged.mockRestore();
});

describe("getArticleStats", () => {
  it("answers no stats for no slugs without a request", async () => {
    expect(await getArticleStats([])).toBe(NO_ARTICLE_STATS);
    expect(stub.from).not.toHaveBeenCalled();
    expect(logged).not.toHaveBeenCalled();
  });

  it("answers no stats and stays quiet when Supabase is not configured", async () => {
    stub.isConfigured = false;

    expect(await getArticleStats(SLUGS)).toBe(NO_ARTICLE_STATS);
    expect(stub.from).not.toHaveBeenCalled();
    expect(logged).not.toHaveBeenCalled();
  });

  it("asks one table for three columns of exactly the given slugs, under a deadline", async () => {
    stub.readAnswer.mockResolvedValue({ data: [], error: null });

    await getArticleStats(SLUGS);

    expect(stub.from).toHaveBeenCalledTimes(1);
    expect(stub.from).toHaveBeenCalledWith("article_stats");
    expect(stub.select).toHaveBeenCalledWith("slug,views,likes");
    expect(stub.inFilter).toHaveBeenCalledWith("slug", SLUGS);
    expect(stub.readAnswer).toHaveBeenCalledWith(expect.any(AbortSignal));
    expect(stub.rpc).not.toHaveBeenCalled();
  });

  it("maps the rows to counts by slug", async () => {
    stub.readAnswer.mockResolvedValue({
      data: [
        { slug: "magnus-carlsen", views: 120, likes: 7 },
        { slug: "judit-polgar", views: 0, likes: 0 },
      ],
      error: null,
    });

    expect(await getArticleStats(SLUGS)).toEqual({
      "magnus-carlsen": { views: 120, likes: 7 },
      "judit-polgar": { views: 0, likes: 0 },
    });
    expect(logged).not.toHaveBeenCalled();
  });

  it("drops a malformed row and keeps the rest", async () => {
    stub.readAnswer.mockResolvedValue({
      data: [
        { slug: "magnus-carlsen", views: "120", likes: 7 },
        { slug: "judit-polgar", views: 4, likes: 1 },
      ],
      error: null,
    });

    expect(await getArticleStats(SLUGS)).toEqual({ "judit-polgar": { views: 4, likes: 1 } });
  });

  it("answers no stats and logs the cause once on an error answer", async () => {
    stub.readAnswer.mockResolvedValue({ data: null, error: POSTGREST_ERROR });

    expect(await getArticleStats(SLUGS)).toBe(NO_ARTICLE_STATS);
    expect(logged).toHaveBeenCalledTimes(1);
    expect(logged).toHaveBeenCalledWith(expect.any(String), POSTGREST_ERROR);
  });

  it("answers no stats and logs the cause once when the fetch throws", async () => {
    const cause = new TypeError("fetch failed");
    stub.readAnswer.mockRejectedValue(cause);

    await expect(getArticleStats(SLUGS)).resolves.toBe(NO_ARTICLE_STATS);
    expect(logged).toHaveBeenCalledTimes(1);
    expect(logged).toHaveBeenCalledWith(expect.any(String), cause);
  });

  it("answers no stats when building the query throws", async () => {
    const cause = new Error("client is broken");
    stub.from.mockImplementationOnce(() => {
      throw cause;
    });

    await expect(getArticleStats(SLUGS)).resolves.toBe(NO_ARTICLE_STATS);
    expect(logged).toHaveBeenCalledWith(expect.any(String), cause);
  });
});

describe("recordArticleEvent", () => {
  it("calls the database function once with the slug and the event, under a deadline", async () => {
    stub.rpcAnswer.mockResolvedValue({ data: [{ views: 1, likes: 0 }], error: null });

    await recordArticleEvent("magnus-carlsen", "view");

    expect(stub.rpc).toHaveBeenCalledTimes(1);
    expect(stub.rpc).toHaveBeenCalledWith("record_article_event", {
      p_slug: "magnus-carlsen",
      p_event: "view",
    });
    expect(stub.rpcAnswer).toHaveBeenCalledWith(expect.any(AbortSignal));
  });

  it("answers the counts from the one row the function returns", async () => {
    stub.rpcAnswer.mockResolvedValue({ data: [{ views: 121, likes: 8 }], error: null });

    expect(await recordArticleEvent("magnus-carlsen", "like")).toEqual({
      status: "recorded",
      counts: { views: 121, likes: 8 },
    });
  });

  it("accepts the counts as one object", async () => {
    stub.rpcAnswer.mockResolvedValue({ data: { views: 121, likes: 6 }, error: null });

    expect(await recordArticleEvent("magnus-carlsen", "unlike")).toEqual({
      status: "recorded",
      counts: { views: 121, likes: 6 },
    });
  });

  it("fails with the cause on an error answer, without a second attempt", async () => {
    stub.rpcAnswer.mockResolvedValue({ data: null, error: POSTGREST_ERROR });

    expect(await recordArticleEvent("magnus-carlsen", "like")).toEqual({
      status: "failed",
      cause: POSTGREST_ERROR,
    });
    expect(stub.rpc).toHaveBeenCalledTimes(1);
  });

  it("fails with the cause when the call throws", async () => {
    const cause = new TypeError("fetch failed");
    stub.rpcAnswer.mockRejectedValue(cause);

    await expect(recordArticleEvent("magnus-carlsen", "like")).resolves.toEqual({
      status: "failed",
      cause,
    });
  });

  it.each([
    ["no rows", []],
    ["a null answer", null],
    ["counts as text", [{ views: "121", likes: "8" }]],
    ["a negative count", [{ views: 121, likes: -1 }]],
    ["a missing count", [{ views: 121 }]],
  ])("fails on %s", async (_label, data) => {
    stub.rpcAnswer.mockResolvedValue({ data, error: null });

    expect(await recordArticleEvent("magnus-carlsen", "like")).toMatchObject({ status: "failed" });
  });

  it("is unavailable when Supabase is not configured", async () => {
    stub.isConfigured = false;

    expect(await recordArticleEvent("magnus-carlsen", "view")).toMatchObject({
      status: "unavailable",
    });
    expect(stub.rpc).not.toHaveBeenCalled();
  });

  it.each([
    ["a recorded event", { data: [{ views: 1, likes: 1 }], error: null }],
    ["an error answer", { data: null, error: POSTGREST_ERROR }],
    ["a malformed answer", { data: [], error: null }],
  ])("never reads or writes the table directly after %s", async (_label, answer) => {
    stub.rpcAnswer.mockResolvedValue(answer);

    await recordArticleEvent("magnus-carlsen", "unlike");

    expect(stub.from).not.toHaveBeenCalled();
    expect(stub.rpc).toHaveBeenCalledTimes(1);
  });
});
