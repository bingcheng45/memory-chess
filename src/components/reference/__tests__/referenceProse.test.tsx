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
  // The game UI renders no h1 of its own, so this block owns the route's
  // sole h1.
  it("renders exactly one h1", async () => {
    const { container } = render(await GameReference({ locale: "en" }));

    expect(container.querySelectorAll("h1")).toHaveLength(1);
  });
});
