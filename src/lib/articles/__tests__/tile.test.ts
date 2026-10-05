import { chooseTile, tileArticleOf, type TileArticle } from "@/lib/articles/tile";
import { makeArticle } from "./fixtures";

const [alder, birch, cedar] = [0, 1, 2].map((index) => tileArticleOf(makeArticle(index)));
const ALL: readonly TileArticle[] = [alder, birch, cedar];

const opened =
  (...slugs: string[]) =>
  (slug: string) =>
    slugs.includes(slug);
const nothingOpened = opened();

describe("tileArticleOf", () => {
  it("keeps what the tile shows and drops the body, the sources and the photo credit", () => {
    expect(tileArticleOf(makeArticle(0))).toStrictEqual({
      slug: "alder-fixture",
      title: "How Alder rebuilt a board from memory",
      person: { name: "Alder Fixture", role: "Fixture champion 1" },
      photo: {
        src: "/images/articles/magnus-carlsen.jpg",
        width: 840,
        height: 1050,
        alt: "Alder Fixture at a chess board",
      },
      drill: {
        pieceCount: 12,
        memorizeTime: 5,
        why: "Five seconds and twelve pieces match the test this fixture describes.",
      },
    });
  });
});

describe("chooseTile", () => {
  it.each([
    [0, "alder-fixture"],
    [0.34, "birch-fixture"],
    [0.5, "birch-fixture"],
    [0.99, "cedar-fixture"],
  ])("with nothing opened and a random source at %s shows %s", (random, slug) => {
    expect(chooseTile(ALL, nothingOpened, () => random)).toStrictEqual({
      kind: "showing",
      article: ALL.find((article) => article.slug === slug),
    });
  });

  it("shows only an article this tab has not opened", () => {
    const isOpened = opened("alder-fixture", "cedar-fixture");

    expect([0, 0.5, 0.99].map((random) => chooseTile(ALL, isOpened, () => random))).toStrictEqual([
      { kind: "showing", article: birch },
      { kind: "showing", article: birch },
      { kind: "showing", article: birch },
    ]);
  });

  it("chooses among the unopened ones when two are left", () => {
    const isOpened = opened("birch-fixture");

    expect(chooseTile(ALL, isOpened, () => 0)).toStrictEqual({ kind: "showing", article: alder });
    expect(chooseTile(ALL, isOpened, () => 0.99)).toStrictEqual({ kind: "showing", article: cedar });
  });

  it("falls back to every article once all of them were opened", () => {
    const isOpened = opened("alder-fixture", "birch-fixture", "cedar-fixture");

    expect(chooseTile(ALL, isOpened, () => 0)).toStrictEqual({ kind: "showing", article: alder });
    expect(chooseTile(ALL, isOpened, () => 0.99)).toStrictEqual({ kind: "showing", article: cedar });
  });

  it("shows the only article there is, opened or not", () => {
    expect(chooseTile([birch], nothingOpened, () => 0.99)).toStrictEqual({ kind: "showing", article: birch });
    expect(chooseTile([birch], opened("birch-fixture"), () => 0)).toStrictEqual({ kind: "showing", article: birch });
  });

  it("is hidden when there is no article, and showing when there is one", () => {
    expect(chooseTile([], nothingOpened, () => 0)).toStrictEqual({ kind: "hidden" });
    expect(chooseTile([alder], nothingOpened, () => 0)).toStrictEqual({ kind: "showing", article: alder });
  });

  it("stays inside the list when the random source answers 1", () => {
    expect(chooseTile(ALL, nothingOpened, () => 1)).toStrictEqual({ kind: "showing", article: cedar });
  });
});
