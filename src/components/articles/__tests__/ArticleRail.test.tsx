import { render, screen } from "@testing-library/react";
import ArticleRail from "@/components/articles/ArticleRail";

const RAIL_HEIGHT = "--rail-height";

class FakeResizeObserver {
  readonly watched = new Set<Element>();

  constructor(private readonly report: ResizeObserverCallback) {
    observers.push(this);
  }

  observe(target: Element) {
    this.watched.add(target);
  }

  unobserve(target: Element) {
    this.watched.delete(target);
  }

  disconnect() {
    this.watched.clear();
  }

  resizeTo(height: number) {
    const entries = Array.from(this.watched, (target) => ({ target, contentRect: { height } }) as ResizeObserverEntry);
    if (entries.length > 0) this.report(entries, this);
  }
}

const realResizeObserver = global.ResizeObserver;
let observers: FakeResizeObserver[] = [];

function renderRail() {
  const view = render(
    <ArticleRail>
      <p>Fact file</p>
    </ArticleRail>,
  );
  const rail = view.container.querySelector<HTMLElement>("[data-article-rail]")!;
  return { ...view, rail, heightOf: () => rail.style.getPropertyValue(RAIL_HEIGHT) };
}

beforeEach(() => {
  observers = [];
  global.ResizeObserver = FakeResizeObserver;
});

afterEach(() => {
  global.ResizeObserver = realResizeObserver;
});

describe("ArticleRail", () => {
  it("has no height until the browser measures the rail, then follows every height it reports", () => {
    const { heightOf } = renderRail();

    expect(heightOf()).toBe("");

    observers[0].resizeTo(806);
    expect(heightOf()).toBe("806px");

    observers[0].resizeTo(863.59375);
    expect(heightOf()).toBe("863.59375px");
  });

  it("measures the rail itself, with the portrait and fact file it was given inside", () => {
    const { rail } = renderRail();

    expect(observers).toHaveLength(1);
    expect(Array.from(observers[0].watched)).toEqual([rail]);
    expect(rail).toContainElement(screen.getByText("Fact file"));
  });

  it("stops measuring when it unmounts", () => {
    const { rail, unmount } = renderRail();
    observers[0].resizeTo(806);
    expect(Array.from(observers[0].watched)).toEqual([rail]);

    unmount();

    expect(Array.from(observers[0].watched)).toEqual([]);
  });

  it("still shows the rail in a browser with no ResizeObserver, with no height set", () => {
    (global as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver = undefined;

    const { rail, heightOf } = renderRail();

    expect(rail).toContainElement(screen.getByText("Fact file"));
    expect(heightOf()).toBe("");
  });
});
