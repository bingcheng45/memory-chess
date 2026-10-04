import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@/test-utils/intl";
import ArticleLink from "@/components/articles/ArticleLink";
import ArticlePortrait from "@/components/articles/ArticlePortrait";
import { clearArrival, peekArrival } from "@/components/articles/articleArrival";
import { SLUG, stubViewTransitions } from "@/components/articles/__tests__/flightHarness";
import { photoNamed, recordWarmedImages, setSaveData } from "@/components/articles/__tests__/warmedImages";
import type { PortraitPhoto } from "@/lib/articles/schema";

jest.mock("next/link", () => {
  function MockNextLink({ children, href, ...props }: ComponentProps<"a">) {
    return (
      <a href={typeof href === "string" ? href : "#"} {...props}>
        {children}
      </a>
    );
  }

  return MockNextLink;
});

jest.mock("@/i18n/navigation", () => ({
  ...jest.requireActual("@/i18n/navigation"),
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/articles",
}));

const CARD_FILE = "http://localhost/_next/image?url=%2Fimages%2Farticles%2Falder.jpg&w=256&q=75";
const ARTICLE_SIZES = "(max-width: 820px) 190px, 280px";

const warmed = recordWarmedImages();
const link = () => screen.getByRole("link");

function renderCard(photo: PortraitPhoto, shownFile: string | null = CARD_FILE) {
  render(
    <ArticleLink article={SLUG} portrait={photo} data-article-card={SLUG}>
      {shownFile === null ? null : <ArticlePortrait photo={photo} sizes="96px" />}
      Open the article
    </ArticleLink>,
  );
  const portrait = link().querySelector("img");
  if (portrait) Object.defineProperty(portrait, "currentSrc", { value: shownFile });
}

afterEach(() => {
  clearArrival();
  Reflect.deleteProperty(document, "startViewTransition");
});

describe("ArticleLink and the portrait the visitor already has", () => {
  it("hands the article the file the card's portrait is showing", () => {
    renderCard(photoNamed("shown"));

    fireEvent.click(link());

    expect(peekArrival(SLUG)?.portraitSrc).toBe(CARD_FILE);
  });

  it("hands over the same file when the card flies", () => {
    stubViewTransitions();
    renderCard(photoNamed("flown"));

    fireEvent.click(link());

    expect(peekArrival(SLUG)?.portraitSrc).toBe(CARD_FILE);
  });

  it("hands over nothing when the portrait has not loaded a file yet", () => {
    renderCard(photoNamed("unloaded"), "");

    fireEvent.click(link());

    expect(peekArrival(SLUG)).toMatchObject({ slug: SLUG, portraitSrc: null });
  });

  it("hands over nothing from a link that shows no portrait, such as the next-article link", () => {
    renderCard(photoNamed("no-portrait"), null);

    fireEvent.click(link());

    expect(peekArrival(SLUG)).toMatchObject({ slug: SLUG, portraitSrc: null });
  });
});

describe("ArticleLink warming the article's portrait on intent", () => {
  it.each([
    ["the pointer enters", (target: HTMLElement) => fireEvent.pointerEnter(target), "pointer"],
    ["it takes focus", (target: HTMLElement) => fireEvent.focus(target), "focus"],
    ["a finger touches it", (target: HTMLElement) => fireEvent.touchStart(target), "touch"],
  ])("asks for the article-size file when %s", (_name, showIntent, name) => {
    renderCard(photoNamed(name));

    showIntent(link());

    expect(warmed).toHaveLength(1);
    expect(warmed[0].sizes).toBe(ARTICLE_SIZES);
    expect(warmed[0].srcset).toContain(`/_next/image?url=%2Fimages%2Farticles%2F${name}.jpg&w=384&q=75 384w`);
  });

  it("asks once for an article, however often the visitor shows intent", () => {
    renderCard(photoNamed("repeated"));

    fireEvent.pointerEnter(link());
    fireEvent.focus(link());
    fireEvent.touchStart(link());
    fireEvent.pointerEnter(link());

    expect(warmed).toHaveLength(1);
  });

  it("asks again for another article", () => {
    renderCard(photoNamed("first-of-two"));
    fireEvent.pointerEnter(link());

    render(
      <ArticleLink article="birch-fixture" portrait={photoNamed("second-of-two")}>
        Another card
      </ArticleLink>,
    );
    fireEvent.pointerEnter(screen.getByRole("link", { name: "Another card" }));

    expect(warmed.map((image) => image.srcset.includes("second-of-two"))).toEqual([false, true]);
  });

  it("asks for nothing while the visitor saves data, and asks once they stop", () => {
    renderCard(photoNamed("save-data"));

    setSaveData(true);
    fireEvent.pointerEnter(link());
    expect(warmed).toHaveLength(0);

    setSaveData(false);
    fireEvent.pointerEnter(link());
    expect(warmed).toHaveLength(1);
  });

  it.each([
    ["a command click", { metaKey: true }],
    ["a control click", { ctrlKey: true }],
    ["a shift click", { shiftKey: true }],
    ["an option click", { altKey: true }],
    ["a middle click", { button: 1 }],
  ])("neither warms nor hands over a portrait on %s, and a plain click still hands one over", (name, init) => {
    renderCard(photoNamed(name.replaceAll(" ", "-")));

    fireEvent.click(link(), init);
    expect(warmed).toHaveLength(0);
    expect(peekArrival(SLUG)).toBeNull();

    fireEvent.click(link());
    expect(peekArrival(SLUG)?.portraitSrc).toBe(CARD_FILE);
  });

  it("warms nothing from the link back to the list", () => {
    render(<ArticleLink backFrom={SLUG}>All articles</ArticleLink>);

    fireEvent.pointerEnter(link());
    fireEvent.focus(link());

    expect(warmed).toHaveLength(0);
    expect(link()).toHaveAttribute("href", "/articles");
  });
});
