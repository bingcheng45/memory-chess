import { render, screen } from "@testing-library/react";
import GameLayout from "@/app/[locale]/game/layout";
import { useTileArticles } from "@/components/game/TileArticlesProvider";
import { ARTICLES } from "@/lib/articles";
import germanCarlsen from "@/lib/articles/translations/de/magnus-carlsen.json";

jest.mock("@/lib/articles/translatedLocales");

jest.mock("@/components/reference/GameReference", () => {
  function MockGameReference() {
    return null;
  }

  return MockGameReference;
});

const ENGLISH_CARLSEN_TITLE = "How Magnus Carlsen names a famous game from one position";

function TitlesThePageWasGiven() {
  return (
    <ul>
      {useTileArticles().map((article) => (
        <li key={article.slug}>{article.title}</li>
      ))}
    </ul>
  );
}

async function renderGameLayout(locale: string) {
  render(await GameLayout({ children: <TitlesThePageWasGiven />, params: Promise.resolve({ locale }) }));
  return screen.queryAllByRole("listitem").map((item) => item.textContent);
}

describe("the game layout's articles for the result screen's tile", () => {
  it("hands the English page every article in English", async () => {
    const titles = await renderGameLayout("en");

    expect(titles).toHaveLength(ARTICLES.length);
    expect(titles).toContain(ENGLISH_CARLSEN_TITLE);
  });

  it("hands a page whose locale serves the articles the translated titles, and no English one", async () => {
    const titles = await renderGameLayout("de");

    expect(titles).toHaveLength(ARTICLES.length);
    expect(titles).toContain(germanCarlsen.text.title);
    expect(titles).not.toContain(ENGLISH_CARLSEN_TITLE);
  });

  it("hands a page whose locale does not serve the articles nothing", async () => {
    expect(await renderGameLayout("fr")).toEqual([]);
  });
});
