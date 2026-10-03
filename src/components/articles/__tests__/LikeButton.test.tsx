import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import LikeButton from "@/components/articles/LikeButton";
import { trackEvent } from "@/lib/analytics/events";
import { ARTICLE_STATS_COPY } from "@/lib/articles/copy";
import { LIKED_STORAGE_KEY, likedStore } from "@/lib/articles/likedStore";

jest.mock("@/lib/analytics/events", () => ({ trackEvent: jest.fn() }));

const SLUG = "alder-fixture";

type Answer = { status: number; body?: unknown };

function deferredFetch() {
  const settle: ((answer: Answer) => void)[] = [];
  const fetchMock = jest.fn(
    () =>
      new Promise((resolve) => {
        settle.push(({ status, body }) => resolve({ status, json: async () => body }));
      }),
  );
  global.fetch = fetchMock as unknown as typeof fetch;
  return {
    fetchMock,
    answer: async (answer: Answer) => {
      await act(async () => {
        settle.shift()?.(answer);
      });
    },
  };
}

const button = () => screen.getByRole("button", { name: ARTICLE_STATS_COPY.likeButton });
const liveLine = () => screen.getByRole("status");
const storedLikes = () => JSON.parse(window.localStorage.getItem(LIKED_STORAGE_KEY) ?? "[]");

afterEach(() => {
  jest.restoreAllMocks();
  jest.mocked(trackEvent).mockClear();
  likedStore.remove(SLUG);
  window.localStorage.clear();
  Reflect.deleteProperty(global, "fetch");
});

describe("LikeButton at rest", () => {
  it("is an unpressed toggle button that shows the server's count", () => {
    render(<LikeButton slug={SLUG} likes={187} />);

    expect(button()).toHaveAttribute("type", "button");
    expect(button()).toHaveAttribute("aria-pressed", "false");
    expect(button()).toHaveTextContent(/^187$/);
    expect(button()).toHaveAccessibleDescription("187");
  });

  it("groups a large count", () => {
    render(<LikeButton slug={SLUG} likes={2140} />);

    expect(button()).toHaveTextContent(/^2,140$/);
  });

  it.each([0, undefined])("shows no number for a count of %p", (likes) => {
    render(<LikeButton slug={SLUG} likes={likes} />);

    expect(button()).toHaveTextContent(/^$/);
    expect(button()).not.toHaveAttribute("aria-describedby");
  });

  it("keeps one polite live line, empty until something fails", () => {
    render(<LikeButton slug={SLUG} likes={187} />);

    expect(liveLine()).toHaveAttribute("aria-live", "polite");
    expect(liveLine()).toBeEmptyDOMElement();
  });

  it("is at least 44px tall and shows its focus", () => {
    render(<LikeButton slug={SLUG} likes={187} />);

    expect(button()).toHaveClass("min-h-11");
    expect(button().className).toContain("focus-visible:outline");
  });

  it("starts pressed when this browser already liked the article", () => {
    window.localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify([SLUG]));

    render(<LikeButton slug={SLUG} likes={187} />);

    expect(button()).toHaveAttribute("aria-pressed", "true");
    expect(button()).toHaveTextContent(/^187$/);
  });

  it.each([0, undefined])("shows 1, not nothing, when this browser liked it and the page still says %p", (likes) => {
    window.localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify([SLUG]));

    render(<LikeButton slug={SLUG} likes={likes} />);

    expect(button()).toHaveAttribute("aria-pressed", "true");
    expect(button()).toHaveTextContent(/^1$/);
  });

  it("follows a like made in another tab", () => {
    render(<LikeButton slug={SLUG} likes={187} />);

    act(() => {
      window.localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify([SLUG]));
      window.dispatchEvent(new StorageEvent("storage", { key: LIKED_STORAGE_KEY }));
    });

    expect(button()).toHaveAttribute("aria-pressed", "true");
  });
});

describe("a like", () => {
  it("shows at once, before the server answers, then takes the server's count", async () => {
    const { fetchMock, answer } = deferredFetch();
    render(<LikeButton slug={SLUG} likes={187} />);

    fireEvent.click(button());

    expect(button()).toHaveAttribute("aria-pressed", "true");
    expect(button()).toHaveTextContent(/^188$/);
    expect(storedLikes()).toEqual([SLUG]);
    expect(fetchMock).toHaveBeenCalledWith(`/api/articles/${SLUG}/stats`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event: "like" }),
      keepalive: true,
      signal: expect.any(AbortSignal),
    });

    await answer({ status: 200, body: { views: 2140, likes: 191 } });

    expect(button()).toHaveAttribute("aria-pressed", "true");
    expect(button()).toHaveTextContent(/^191$/);
    expect(liveLine()).toBeEmptyDOMElement();
  });

  it("counts from zero when the server sent no count", async () => {
    const { answer } = deferredFetch();
    render(<LikeButton slug={SLUG} likes={undefined} />);

    fireEvent.click(button());
    expect(button()).toHaveTextContent(/^1$/);

    await answer({ status: 200, body: { views: 1, likes: 1 } });
    expect(button()).toHaveTextContent(/^1$/);
  });

  it("fires article_like once, after the server recorded it", async () => {
    const { answer } = deferredFetch();
    render(<LikeButton slug={SLUG} likes={187} />);

    fireEvent.click(button());
    expect(trackEvent).not.toHaveBeenCalled();

    await answer({ status: 200, body: { views: 2140, likes: 188 } });

    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith({ name: "article_like", params: { slug: SLUG } });
  });

  it.each([
    ["a 500", { status: 500, body: { error: "Failed to record the article event" } }],
    ["a 503", { status: 503, body: { error: "Article stats are unavailable" } }],
    ["a 204, which is what a crawler gets", { status: 204 }],
    ["a 200 without counts", { status: 200, body: {} }],
  ])("rolls back on %s and says so", async (_, failure) => {
    const { answer } = deferredFetch();
    render(<LikeButton slug={SLUG} likes={187} />);

    fireEvent.click(button());
    await answer(failure);

    expect(button()).toHaveAttribute("aria-pressed", "false");
    expect(button()).toHaveTextContent(/^187$/);
    expect(storedLikes()).toEqual([]);
    expect(liveLine()).toHaveTextContent(ARTICLE_STATS_COPY.likeFailed);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("rolls back when the request cannot be sent", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    render(<LikeButton slug={SLUG} likes={187} />);

    fireEvent.click(button());

    await waitFor(() => expect(liveLine()).toHaveTextContent(ARTICLE_STATS_COPY.likeFailed));
    expect(button()).toHaveAttribute("aria-pressed", "false");
    expect(button()).toHaveTextContent(/^187$/);
  });

  it("clears the failure line on the next press", async () => {
    const { answer } = deferredFetch();
    render(<LikeButton slug={SLUG} likes={187} />);
    fireEvent.click(button());
    await answer({ status: 500 });

    fireEvent.click(button());

    expect(liveLine()).toBeEmptyDOMElement();
    expect(button()).toHaveAttribute("aria-pressed", "true");
  });

  it("ignores a second press while the first is in flight, and stays focusable", async () => {
    const { fetchMock, answer } = deferredFetch();
    render(<LikeButton slug={SLUG} likes={187} />);

    fireEvent.click(button());
    fireEvent.click(button());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(button()).toHaveAttribute("aria-pressed", "true");
    expect(button()).toHaveTextContent(/^188$/);
    expect(button()).not.toBeDisabled();

    await answer({ status: 200, body: { views: 1, likes: 188 } });
    fireEvent.click(button());

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("still rolls the stored like back when the visitor left before the failure came in", async () => {
    const { answer } = deferredFetch();
    const { unmount } = render(<LikeButton slug={SLUG} likes={187} />);
    fireEvent.click(button());
    unmount();

    await answer({ status: 500 });

    expect(storedLikes()).toEqual([]);
  });

  it("works in a browser whose storage refuses every write", async () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
    });
    const { answer } = deferredFetch();
    render(<LikeButton slug={SLUG} likes={187} />);

    fireEvent.click(button());
    await answer({ status: 200, body: { views: 1, likes: 188 } });

    expect(button()).toHaveAttribute("aria-pressed", "true");
    expect(button()).toHaveTextContent(/^188$/);
  });
});

describe("an unlike", () => {
  beforeEach(() => {
    window.localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify([SLUG]));
  });

  it("shows at once, sends unlike, and takes the server's count", async () => {
    const { fetchMock, answer } = deferredFetch();
    render(<LikeButton slug={SLUG} likes={188} />);

    fireEvent.click(button());

    expect(button()).toHaveAttribute("aria-pressed", "false");
    expect(button()).toHaveTextContent(/^187$/);
    expect(storedLikes()).toEqual([]);
    expect(fetchMock.mock.calls[0]).toEqual([
      `/api/articles/${SLUG}/stats`,
      expect.objectContaining({ body: JSON.stringify({ event: "unlike" }) }),
    ]);

    await answer({ status: 200, body: { views: 2140, likes: 180 } });

    expect(button()).toHaveTextContent(/^180$/);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("never shows a count below zero, and restores the 1 it showed if the unlike fails", async () => {
    const { answer } = deferredFetch();
    render(<LikeButton slug={SLUG} likes={0} />);
    expect(button()).toHaveTextContent(/^1$/);

    fireEvent.click(button());
    expect(button()).toHaveTextContent(/^$/);

    await answer({ status: 500 });
    expect(button()).toHaveAttribute("aria-pressed", "true");
    expect(button()).toHaveTextContent(/^1$/);
  });

  it("rolls back to pressed on a failure", async () => {
    const { answer } = deferredFetch();
    render(<LikeButton slug={SLUG} likes={188} />);

    fireEvent.click(button());
    await answer({ status: 500 });

    expect(button()).toHaveAttribute("aria-pressed", "true");
    expect(button()).toHaveTextContent(/^188$/);
    expect(storedLikes()).toEqual([SLUG]);
    expect(liveLine()).toHaveTextContent(ARTICLE_STATS_COPY.likeFailed);
  });
});
