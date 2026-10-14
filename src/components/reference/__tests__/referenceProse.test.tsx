import { render } from "@/test-utils/intl";
import ContactReference from "@/components/reference/ContactReference";
import GameReference from "@/components/reference/GameReference";
import LeaderboardReference from "@/components/reference/LeaderboardReference";
import en from "@/lib/reference/prose/en.json";

jest.mock("next-intl/server", () => {
  const { createTranslator } = jest.requireActual("next-intl");
  const messages = jest.requireActual("../../../../messages/en.json");

  return {
    getTranslations: ({
      locale,
      namespace,
    }: {
      locale: string;
      namespace: string;
    }) => Promise.resolve(createTranslator({ locale, messages, namespace })),
  };
});

function leafStrings(node: unknown): string[] {
  if (typeof node === "string") return [node];
  if (node && typeof node === "object") {
    return Object.values(node).flatMap(leafStrings);
  }
  return [];
}

/** The literal pieces of a template around its `{placeholder}` slots, which
 * render as interpolated numbers the prose file never carries. */
function literalFragments(template: string): string[] {
  return template
    .split(/\{\w+\}/)
    .map((fragment) => fragment.trim())
    .filter(Boolean);
}

function visibleText(container: HTMLElement): string {
  // The JSON-LD script repeats some prose, so strip scripts to assert on
  // what a reader of the HTML sees.
  const clone = container.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("script").forEach((node) => node.remove());
  return clone.textContent ?? "";
}

function expectEveryLeafRendered(section: unknown, container: HTMLElement) {
  const text = visibleText(container);
  const leaves = leafStrings(section);

  expect(leaves.length).toBeGreaterThan(0);
  for (const leaf of leaves) {
    for (const fragment of literalFragments(leaf)) {
      expect(text).toContain(fragment);
    }
  }
}

describe("reference prose coverage", () => {
  it("renders every game leaf string, including the translated preset labels", async () => {
    const { container } = render(await GameReference({ locale: "en" }));

    expectEveryLeafRendered(en.game, container);
  });

  it("renders every leaderboard leaf string", () => {
    const { container } = render(<LeaderboardReference locale="en" />);

    expectEveryLeafRendered(en.leaderboard, container);
  });

  it("renders every contact leaf string", async () => {
    const { container } = render(await ContactReference({ locale: "en" }));

    expectEveryLeafRendered(en.contact, container);
  });
});

describe("game reference heading", () => {
  // The configuration card above this block owns the route's h1.
  it("starts at h2 and renders no h1", async () => {
    const { container } = render(await GameReference({ locale: "en" }));

    expect(container.querySelectorAll("h1")).toHaveLength(0);
    expect(container.querySelector("h2")).toHaveTextContent(en.game.title);
  });
});

describe("game reference guide links", () => {
  const guideLinks = (container: HTMLElement) =>
    Array.from(container.querySelectorAll('a[href^="/learn/"]')).map((link) => [
      link.getAttribute("href"),
      link.textContent,
    ]);

  it("links the English page to four guides with descriptive anchors", async () => {
    const { container } = render(await GameReference({ locale: "en" }));

    expect(guideLinks(container)).toEqual([
      ["/learn/chess-visualization-exercises", "chess visualization exercises"],
      ["/learn/blindfold-chess-training-for-beginners", "blindfold chess training plan"],
      ["/learn/chess-memory-training", "chess memory training ladder"],
      ["/learn/how-to-see-the-whole-board-in-chess", "see the whole board"],
    ]);
  });

  it("leaves the English-only guide list off a translated page", async () => {
    const { container } = render(await GameReference({ locale: "de" }));

    expect(guideLinks(container)).toEqual([]);
  });
});
