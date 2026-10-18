import { StrictMode, type ComponentProps } from "react";
import { fireEvent, render, screen, within } from "@/test-utils/intl";
import { peekArrival } from "@/components/articles/articleArrival";
import ArticleTile from "@/components/game/ArticleTile";
import TileArticlesProvider from "@/components/game/TileArticlesProvider";
import { makeArticle } from "@/lib/articles/__tests__/fixtures";
import { tileArticleOf, type RandomSource, type RoundSize, type TileArticle } from "@/lib/articles/tile";
import { VIEWED_STORAGE_KEY, viewedStore } from "@/lib/articles/viewedStore";
import { useGameStore } from "@/lib/store/gameStore";
import czech from "../../../../messages/cs.json";
import german from "../../../../messages/de.json";
import polish from "../../../../messages/pl.json";
import russian from "../../../../messages/ru.json";

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

jest.mock("@/lib/utils/soundEffects", () => ({ playSound: jest.fn() }));

const ALDER_DRILL = { pieceCount: 20, memorizeTime: 3, why: "Three seconds and twenty pieces are what only Alder asks for." };
const alder = tileArticleOf(makeArticle(0, { drill: ALDER_DRILL }));
const [birch, cedar] = [1, 2].map((index) => tileArticleOf(makeArticle(index)));
const ALL: readonly TileArticle[] = [alder, birch, cedar];
const MEDIUM_ROUND: RoundSize = { pieceCount: 6, memorizeTime: 10 };
const first: RandomSource = () => 0;
const last: RandomSource = () => 0.99;

type TileOptions = {
  articles?: readonly TileArticle[];
  round?: RoundSize;
  random?: RandomSource;
};

function tile({ articles = ALL, round = MEDIUM_ROUND, random = first }: TileOptions = {}) {
  return (
    <TileArticlesProvider articles={articles}>
      <ArticleTile round={round} random={random} />
    </TileArticlesProvider>
  );
}

function markOpened(...slugs: string[]) {
  window.sessionStorage.setItem(VIEWED_STORAGE_KEY, JSON.stringify(slugs));
}

function shownSlug() {
  return document.querySelector("section[data-article-tile]")?.getAttribute("data-article-tile");
}

function stayOnThePage(link: HTMLElement) {
  link.addEventListener("click", (event) => event.preventDefault());
}

let gtag: jest.Mock;

beforeEach(() => {
  window.sessionStorage.clear();
  jest.spyOn(console, "log").mockImplementation(() => {});
  useGameStore.getState().resetGame();
  gtag = jest.fn();
  window.gtag = gtag;
});

afterEach(() => {
  jest.restoreAllMocks();
  Reflect.deleteProperty(window, "gtag");
});

describe("ArticleTile", () => {
  it("shows one article under a label, with its portrait, title and person", () => {
    render(tile());
    const section = screen.getByRole("region", { name: "Read next" });

    expect(within(section).getByRole("heading", { level: 3 })).toHaveTextContent(
      "How Alder rebuilt a board from memory",
    );
    expect(within(section).getByText("Alder Fixture")).toBeInTheDocument();
    expect(within(section).getByText("Fixture champion 1")).toBeInTheDocument();

    const portrait = within(section).getByRole("img", { name: "Alder Fixture at a chess board" });
    expect(portrait).toHaveAttribute("loading", "lazy");
    expect(portrait).toHaveAttribute("width", "840");
    expect(portrait).toHaveAttribute("height", "1050");
  });

  it("sets the round just played beside the drill sized to a new player, not the article's own 20 pieces", () => {
    render(tile());

    expect(screen.getByText("Your round").closest("div")).toHaveTextContent("Your round6 pieces, 10 seconds");
    expect(screen.getByText("This drill at your level").closest("div")).toHaveTextContent(
      "This drill at your level4 pieces, 10 seconds",
    );
    expect(screen.getByText("Your round").tagName).toBe("DT");
    expect(screen.getByText("6 pieces, 10 seconds").tagName).toBe("DD");
  });

  it("explains the sized round in a generic line, not the article's reason for its own 20 pieces at 3 seconds", () => {
    render(tile());
    const section = screen.getByRole("region", { name: "Read next" });

    expect([
      within(section).queryByText("Three seconds and twenty pieces are what only Alder asks for."),
      within(section).getByText("Sized to your level, to practise what the article describes.").tagName,
    ]).toEqual([null, "P"]);
  });

  it("keeps the article's reason, and offers no second drill, when the sized round is the article's own", () => {
    const fitting = tileArticleOf(makeArticle(0, { drill: { pieceCount: 4, memorizeTime: 10, why: "Ten seconds and four pieces are where Alder starts." } }));
    render(tile({ articles: [fitting] }));

    expect([
      screen.getByText("Ten seconds and four pieces are where Alder starts.").tagName,
      screen.queryByText("Sized to your level, to practise what the article describes."),
      document.querySelector("[data-article-drill-original]"),
    ]).toEqual(["P", null, null]);
  });

  it("says 1 piece and 1 second in the singular", () => {
    render(tile({ round: { pieceCount: 1, memorizeTime: 1 } }));

    expect(screen.getByText("Your round").closest("div")).toHaveTextContent("Your round1 piece, 1 second");
  });

  it("offers reading first and the drill second", () => {
    render(tile());
    const read = screen.getByRole("link", { name: "Read the article" });
    const drill = screen.getByRole("button", { name: "Try that drill" });

    expect(read).toHaveAttribute("href", "/articles/alder-fixture");
    expect(read).not.toHaveAttribute("target");
    expect(read.compareDocumentPosition(drill) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders nothing with no articles or no provider, and a tile when the page was given an article", () => {
    const empty = render(tile({ articles: [] }));
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    empty.unmount();

    const unprovided = render(<ArticleTile round={MEDIUM_ROUND} random={first} />);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    unprovided.unmount();

    render(tile({ articles: [birch] }));
    expect(screen.getByRole("region", { name: "Read next" })).toBeInTheDocument();
    expect(shownSlug()).toBe("birch-fixture");
  });

  it("speaks the page's language and links to the article in that language", () => {
    render(tile(), { locale: "de", messages: german });
    const section = screen.getByRole("region", { name: "Als Nächstes lesen" });

    expect(within(section).getByRole("link", { name: "Artikel lesen" })).toHaveAttribute(
      "href",
      "/de/articles/alder-fixture",
    );
    expect(within(section).getByRole("button", { name: "Diese Übung ausprobieren" })).toBeInTheDocument();
    expect(within(section).getByText("Deine Runde").closest("div")).toHaveTextContent(
      "Deine Runde6 Figuren, 10 Sekunden",
    );
    expect(within(section).getByText("Diese Übung auf deinem Niveau").closest("div")).toHaveTextContent(
      "Diese Übung auf deinem Niveau4 Figuren, 10 Sekunden",
    );
  });
});

describe("the round sizes in a language with few and many forms", () => {
  const size = (pieceCount: number, memorizeTime: number): RoundSize => ({ pieceCount, memorizeTime });

  it.each([
    ["ru", russian, size(1, 1), "1 фигура, 1 секунда", "4 фигуры, 10 секунд"],
    ["ru", russian, size(22, 21), "22 фигуры, 21 секунда", "4 фигуры, 10 секунд"],
    ["pl", polish, size(1, 1), "1 bierka, 1 sekunda", "4 bierki, 10 sekund"],
    ["pl", polish, size(5, 10), "5 bierek, 10 sekund", "4 bierki, 10 sekund"],
    ["cs", czech, size(1, 1), "1 figurka, 1 sekunda", "4 figurky, 10 sekund"],
    ["cs", czech, size(22, 21), "22 figurek, 21 sekund", "4 figurky, 10 sekund"],
  ])("in %s reads both boxes, case %#", (locale, messages, round, roundText, drillText) => {
    render(tile({ round }), { locale, messages });

    expect(screen.getAllByRole("definition").map((box) => box.textContent)).toEqual([roundText, drillText]);
  });
});

describe("which article the tile shows", () => {
  it("follows the random source when nothing was opened", () => {
    const { unmount } = render(tile({ random: first }));
    expect(shownSlug()).toBe("alder-fixture");
    unmount();

    render(tile({ random: last }));
    expect(shownSlug()).toBe("cedar-fixture");
  });

  it("prefers the article this tab has not opened", () => {
    markOpened("alder-fixture", "birch-fixture");

    render(tile({ random: first }));

    expect(shownSlug()).toBe("cedar-fixture");
  });

  it("still shows a tile once every article was opened", () => {
    markOpened("alder-fixture", "birch-fixture", "cedar-fixture");

    render(tile({ random: last }));

    expect(shownSlug()).toBe("cedar-fixture");
  });

  it("keeps its article when the screen renders again with another random source and another round", () => {
    const { rerender } = render(tile({ random: first }));
    expect(shownSlug()).toBe("alder-fixture");

    rerender(tile({ random: last, round: { pieceCount: 2, memorizeTime: 3 } }));

    expect(shownSlug()).toBe("alder-fixture");
    expect(screen.getByText("Your round").closest("div")).toHaveTextContent("Your round2 pieces, 3 seconds");
  });

  it("keeps its article under StrictMode, which runs the choosing effect twice", () => {
    const { rerender } = render(<StrictMode>{tile({ random: first })}</StrictMode>);
    expect(shownSlug()).toBe("alder-fixture");

    rerender(<StrictMode>{tile({ random: last })}</StrictMode>);

    expect(shownSlug()).toBe("alder-fixture");
  });

  it("keeps its article when that article is opened while the tile is on screen", () => {
    render(tile({ random: first }));

    viewedStore.add("alder-fixture");
    fireEvent(window, new StorageEvent("storage", { key: VIEWED_STORAGE_KEY }));

    expect(shownSlug()).toBe("alder-fixture");
  });
});

describe("the tile's actions", () => {
  it("starts the round sized to a new player, not the article's 20 pieces at 3 seconds", () => {
    render(tile({ random: first }));
    expect(useGameStore.getState().round.phase).toBe("idle");

    fireEvent.click(screen.getByRole("button", { name: "Try that drill" }));

    const { gameState, lastSettings, round } = useGameStore.getState();
    expect([round.phase, gameState.pieceCount, gameState.memorizeTime]).toEqual(["study", 4, 10]);
    expect(lastSettings).toEqual({ pieceCount: 4, memorizeTime: 10 });
  });

  it("sizes the drill to a returning player's saved rating, as the article page does", () => {
    localStorage.setItem("memory-chess-storage", JSON.stringify({ state: { gameState: { skillRating: 1300 }, certainty: { rd: 60, rounds: 40 } }, version: 3 }));
    try {
      render(tile({ random: first }));
      const shownSize = screen.getByText("This drill at your level").closest("div")?.textContent;

      fireEvent.click(screen.getByRole("button", { name: "Try that drill" }));

      const { gameState } = useGameStore.getState();
      expect([shownSize, gameState.pieceCount, gameState.memorizeTime]).toEqual(["This drill at your level8 pieces, 10 seconds", 8, 10]);
    } finally {
      localStorage.clear();
    }
  });

  it("reports the drill once, with the slug", () => {
    render(tile({ random: first }));

    fireEvent.click(screen.getByRole("button", { name: "Try that drill" }));

    expect(gtag.mock.calls).toEqual([
      ["event", "article_tile_click", { slug: "alder-fixture", action: "drill" }],
      ["event", "round_start", { piece_count: 4, memorize_time: 10, round_source: "tile_drill" }],
    ]);
  });

  it("still offers the article's own drill, and starts it at 20 pieces and 3 seconds", () => {
    render(tile({ random: first }));
    const original = screen.getByRole("button", { name: "This article's drill 20 pieces, 3 seconds" });

    fireEvent.click(original);

    const { gameState, round } = useGameStore.getState();
    expect([original.hasAttribute("data-article-drill-original"), round.phase, gameState.pieceCount, gameState.memorizeTime]).toEqual([true, "study", 20, 3]);
    expect(gtag.mock.calls).toEqual([
      ["event", "article_tile_click", { slug: "alder-fixture", action: "drill_original" }],
      ["event", "round_start", { piece_count: 20, memorize_time: 3, round_source: "tile_drill" }],
    ]);
  });

  it("reports the read once, with the slug, and starts no round", () => {
    render(tile({ random: last }));
    const read = screen.getByRole("link", { name: "Read the article" });
    stayOnThePage(read);

    fireEvent.click(read);

    expect(gtag.mock.calls).toEqual([["event", "article_tile_click", { slug: "cedar-fixture", action: "read" }]]);
    expect(useGameStore.getState().round.phase).toBe("idle");
    expect(peekArrival("cedar-fixture")).toBeNull();
  });
});
