import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@/test-utils/intl";
import ArticleLink from "@/components/articles/ArticleLink";
import ArticlePortrait from "@/components/articles/ArticlePortrait";
import { clearArrival, peekArrival } from "@/components/articles/articleArrival";
import {
  BackLink,
  CARD_FILE,
  OtherCard,
  SLUG,
  backLink,
  otherCard,
  photoNamed,
} from "@/components/articles/__tests__/flightHarness";
import { pointerEnters, recordWarmedImages, setSaveData } from "@/components/articles/__tests__/warmedImages";
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

const ARTICLE_SIZES = "(max-width: 820px) 190px, 280px";

const warmed = recordWarmedImages();
const link = () => screen.getByRole("link", { name: /Open the article/ });

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

afterEach(clearArrival);

describe("ArticleLink and the portrait the visitor already has", () => {
  it("hands the article the file the card's portrait is showing", () => {
    renderCard(photoNamed("shown"));

    fireEvent.click(link());

    expect(peekArrival(SLUG)?.portraitSrc).toBe(CARD_FILE);
  });

  it.each([
    ["the portrait has not loaded a file yet", ""],
    ["the link shows no portrait, as the next-article link does not", null],
  ])("hands over nothing when %s", (name, shownFile) => {
    renderCard(photoNamed(name), shownFile);

    fireEvent.click(link());

    expect(peekArrival(SLUG)).toMatchObject({ slug: SLUG, portraitSrc: null });
  });
});

describe("ArticleLink warming the article's portrait on intent", () => {
  it.each([
    ["a mouse pointer enters", (target: HTMLElement) => pointerEnters(target, "mouse"), "mouse"],
    ["it takes focus", (target: HTMLElement) => fireEvent.focus(target), "focus"],
  ])("asks for the article-size file when %s", (_name, showIntent, name) => {
    renderCard(photoNamed(name));

    showIntent(link());

    expect(warmed).toHaveLength(1);
    expect(warmed[0].sizes).toBe(ARTICLE_SIZES);
    expect(warmed[0].srcset).toContain(`/_next/image?url=%2Fimages%2Farticles%2F${name}.jpg&w=384&q=75 384w`);
  });

  it("asks for nothing under a finger, which may only be scrolling, and asks once a mouse arrives", () => {
    renderCard(photoNamed("finger"));

    pointerEnters(link(), "touch");
    fireEvent.touchStart(link());
    pointerEnters(link(), "pen");
    expect(warmed).toHaveLength(0);

    pointerEnters(link(), "mouse");
    expect(warmed).toHaveLength(1);
  });

  it("asks once for an article, however often the visitor shows intent", () => {
    renderCard(photoNamed("repeated"));

    pointerEnters(link(), "mouse");
    fireEvent.focus(link());
    pointerEnters(link(), "mouse");

    expect(warmed).toHaveLength(1);
  });

  it("asks again for another article", () => {
    renderCard(photoNamed("first-of-two"));
    render(<OtherCard />);

    pointerEnters(link(), "mouse");
    pointerEnters(otherCard(), "mouse");

    expect(warmed.map((image) => image.srcset.includes("birch.jpg"))).toEqual([false, true]);
  });

  it.each([
    ["a mouse pointer", (target: HTMLElement) => pointerEnters(target, "mouse"), "mouse"],
    ["focus", (target: HTMLElement) => fireEvent.focus(target), "focus"],
  ])("asks for nothing on %s while the visitor saves data, and asks once they stop", (_name, showIntent, name) => {
    renderCard(photoNamed(`save-data-${name}`));

    setSaveData(true);
    showIntent(link());
    expect(warmed).toHaveLength(0);

    setSaveData(false);
    showIntent(link());
    expect(warmed).toHaveLength(1);
  });

  it("asks for nothing from the link back to the list, and asks from a card beside it", () => {
    render(<BackLink />);
    renderCard(photoNamed("beside-the-back-link"));

    pointerEnters(backLink(), "mouse");
    fireEvent.focus(backLink());
    expect(warmed).toHaveLength(0);

    fireEvent.focus(link());
    expect(warmed).toHaveLength(1);
  });
});
