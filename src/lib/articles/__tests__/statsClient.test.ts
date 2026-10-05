import { sendArticleEvent } from "@/lib/articles/statsClient";
import { ARTICLE_EVENTS } from "@/lib/articles/stats";

const SLUG = "alder-fixture";

function answer(status: number, body: unknown) {
  const fetchMock = jest.fn().mockResolvedValue({ status, json: async () => body });
  global.fetch = fetchMock;
  return fetchMock;
}

afterEach(() => {
  Reflect.deleteProperty(global, "fetch");
});

describe("sendArticleEvent", () => {
  it.each(ARTICLE_EVENTS)("posts %s to the article's stats address as JSON that outlives the page", async (event) => {
    const fetchMock = answer(200, { views: 12, likes: 3 });

    await sendArticleEvent(SLUG, event);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(`/api/articles/${SLUG}/stats`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event }),
      keepalive: true,
      signal: expect.any(AbortSignal),
    });
  });

  it("aborts a request that has not settled after ten seconds, and answers null", async () => {
    jest.useFakeTimers();
    const fetchMock = jest.fn(
      (_url: string, { signal }: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const sent = sendArticleEvent(SLUG, "like");
    jest.advanceTimersByTime(9_999);
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false);
    jest.advanceTimersByTime(1);

    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
    await expect(sent).resolves.toBeNull();
    jest.useRealTimers();
  });

  it("leaves no timer behind once the request settles", async () => {
    jest.useFakeTimers();
    answer(200, { views: 12, likes: 3 });

    await sendArticleEvent(SLUG, "like");

    expect(jest.getTimerCount()).toBe(0);
    jest.useRealTimers();
  });

  it("answers the counts of a 200", async () => {
    answer(200, { views: 2140, likes: 187, slug: SLUG });

    await expect(sendArticleEvent(SLUG, "like")).resolves.toEqual({ views: 2140, likes: 187 });
  });

  it.each([
    ["a 204, which has no body", 204],
    ["a 400", 400],
    ["a 404", 404],
    ["a 500", 500],
    ["a 503", 503],
  ])("answers null for %s", async (_, status) => {
    answer(status, { views: 1, likes: 1 });

    await expect(sendArticleEvent(SLUG, "view")).resolves.toBeNull();
  });

  it.each([
    ["counts that are not whole numbers", { views: "12", likes: 3 }],
    ["a negative count", { views: 12, likes: -1 }],
    ["an error body", { error: "Unknown article" }],
    ["an array", [{ views: 1, likes: 1 }]],
    ["null", null],
  ])("answers null for a 200 with %s", async (_, body) => {
    answer(200, body);

    await expect(sendArticleEvent(SLUG, "like")).resolves.toBeNull();
  });

  it("answers null when the body is not JSON", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      json: async () => {
        throw new SyntaxError("Unexpected end of JSON input");
      },
    });

    await expect(sendArticleEvent(SLUG, "like")).resolves.toBeNull();
  });

  it("answers null when the request fails", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(sendArticleEvent(SLUG, "like")).resolves.toBeNull();
  });

  it("answers null when fetch throws before it returns a promise", async () => {
    global.fetch = jest.fn(() => {
      throw new TypeError("Illegal invocation");
    });

    await expect(sendArticleEvent(SLUG, "like")).resolves.toBeNull();
  });

  it("answers null where there is no fetch at all", async () => {
    await expect(sendArticleEvent(SLUG, "view")).resolves.toBeNull();
  });
});
