import { StrictMode } from "react";
import { render } from "@testing-library/react";
import ViewBeacon from "@/components/articles/ViewBeacon";
import { VIEWED_STORAGE_KEY, viewedStore } from "@/lib/articles/viewedStore";

const SLUG = "alder-fixture";
const OTHER = "birch-fixture";

const viewOf = (slug: string) => [
  `/api/articles/${slug}/stats`,
  expect.objectContaining({ method: "POST", body: JSON.stringify({ event: "view" }), keepalive: true }),
];

let fetchMock: jest.Mock;

beforeEach(() => {
  fetchMock = jest.fn().mockResolvedValue({ status: 200, json: async () => ({ views: 1, likes: 0 }) });
  global.fetch = fetchMock;
});

function setPrerendering(isPrerendering: boolean) {
  Object.defineProperty(document, "prerendering", { configurable: true, value: isPrerendering });
}

function activatePrerenderedPage() {
  setPrerendering(false);
  document.dispatchEvent(new Event("prerenderingchange"));
}

afterEach(() => {
  jest.restoreAllMocks();
  Reflect.deleteProperty(document, "prerendering");
  viewedStore.remove(SLUG);
  viewedStore.remove(OTHER);
  window.sessionStorage.clear();
  Reflect.deleteProperty(global, "fetch");
});

describe("ViewBeacon", () => {
  it("renders nothing", () => {
    const { container } = render(<ViewBeacon slug={SLUG} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("sends one view when the article opens and remembers it for the session", () => {
    render(<ViewBeacon slug={SLUG} />);

    expect(fetchMock.mock.calls).toEqual([viewOf(SLUG)]);
    expect(JSON.parse(window.sessionStorage.getItem(VIEWED_STORAGE_KEY) ?? "[]")).toEqual([SLUG]);
    expect(window.localStorage).toHaveLength(0);
  });

  it("sends nothing for an article this session already opened", () => {
    window.sessionStorage.setItem(VIEWED_STORAGE_KEY, JSON.stringify([SLUG]));

    render(<ViewBeacon slug={SLUG} />);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends nothing more on a re-render or a second mount", () => {
    const first = render(<ViewBeacon slug={SLUG} />);
    first.rerender(<ViewBeacon slug={SLUG} />);
    first.unmount();
    render(<ViewBeacon slug={SLUG} />);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sends once under StrictMode, which runs the effect twice", () => {
    render(
      <StrictMode>
        <ViewBeacon slug={SLUG} />
      </StrictMode>,
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sends one view for each article as the visitor moves between them", () => {
    const { rerender } = render(<ViewBeacon slug={SLUG} />);
    rerender(<ViewBeacon slug={OTHER} />);
    rerender(<ViewBeacon slug={SLUG} />);

    expect(fetchMock.mock.calls).toEqual([viewOf(SLUG), viewOf(OTHER)]);
  });

  it("still sends once, and does not throw, when session storage is blocked", () => {
    jest.spyOn(window, "sessionStorage", "get").mockImplementation(() => {
      throw new DOMException("The operation is insecure.", "SecurityError");
    });

    const first = render(<ViewBeacon slug={SLUG} />);
    first.unmount();
    render(<ViewBeacon slug={SLUG} />);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sends nothing while the browser prerenders the page, then one view when the visitor opens it", () => {
    setPrerendering(true);

    render(<ViewBeacon slug={SLUG} />);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem(VIEWED_STORAGE_KEY)).toBeNull();

    activatePrerenderedPage();
    activatePrerenderedPage();

    expect(fetchMock.mock.calls).toEqual([viewOf(SLUG)]);
  });

  it("sends nothing for a prerendered page the visitor never opens", () => {
    setPrerendering(true);

    const { unmount } = render(<ViewBeacon slug={SLUG} />);
    unmount();
    activatePrerenderedPage();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends once for a prerendered page under StrictMode", () => {
    setPrerendering(true);
    render(
      <StrictMode>
        <ViewBeacon slug={SLUG} />
      </StrictMode>,
    );

    activatePrerenderedPage();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not throw when the request fails", () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    expect(() => render(<ViewBeacon slug={SLUG} />)).not.toThrow();
  });
});
