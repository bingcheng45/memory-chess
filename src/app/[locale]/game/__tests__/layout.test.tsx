import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import GameLayout from "@/app/[locale]/game/layout";
import { useTileArticles } from "@/components/game/TileArticlesProvider";
import { ARTICLES } from "@/lib/articles";
import germanCarlsen from "@/lib/articles/translations/de/magnus-carlsen.json";

jest.mock("@/lib/articles/translatedLocales");

jest.mock("next-intl/server", () => ({
  ...jest.requireActual("next-intl/server"),
  getMessages: jest.fn(async ({ locale }: { locale: string }) =>
    jest.requireActual(`../../../../../messages/${locale}.json`),
  ),
}));

jest.mock("@/components/reference/GameReference", () => {
  function MockGameReference() {
    return null;
  }

  return MockGameReference;
});

const ENGLISH_CARLSEN_TITLE = "How Magnus Carlsen names a famous game from one position";
const ROOT_MESSAGES = { common: { nav: { articles: "Artikel" } } };

function TitlesThePageWasGiven() {
  return (
    <ul>
      {useTileArticles().map((article) => (
        <li key={article.slug}>{article.title}</li>
      ))}
    </ul>
  );
}

function ArticlesStrings() {
  const tile = useTranslations("articles.tile");
  const like = useTranslations("articles.like");
  const nav = useTranslations("common.nav");

  return (
    <>
      <p data-testid="tile">{tile("eyebrow")}</p>
      <p data-testid="like">{like("button")}</p>
      <p data-testid="nav">{nav("articles")}</p>
    </>
  );
}

async function renderGameLayout(children: ReactNode, locale: string) {
  const errors: string[] = [];
  const layout = await GameLayout({ children, params: Promise.resolve({ locale }) });

  render(
    <NextIntlClientProvider locale={locale} messages={ROOT_MESSAGES} onError={(error) => errors.push(error.message)}>
      {layout}
    </NextIntlClientProvider>,
  );

  return errors;
}

async function titlesGivenTo(locale: string) {
  await renderGameLayout(<TitlesThePageWasGiven />, locale);
  return screen.queryAllByRole("listitem").map((item) => item.textContent);
}

describe("the game layout's articles for the result screen's tile", () => {
  it("hands the English page every article in English", async () => {
    const titles = await titlesGivenTo("en");

    expect(titles).toHaveLength(ARTICLES.length);
    expect(titles).toContain(ENGLISH_CARLSEN_TITLE);
  });

  it("hands a page whose locale serves the articles the translated titles, and no English one", async () => {
    const titles = await titlesGivenTo("de");

    expect(titles).toHaveLength(ARTICLES.length);
    expect(titles).toContain(germanCarlsen.text.title);
    expect(titles).not.toContain(ENGLISH_CARLSEN_TITLE);
  });

  it("hands a page whose locale does not serve the articles nothing, though the layout still renders it", async () => {
    expect(await titlesGivenTo("fr")).toEqual([]);
    expect(screen.getByRole("list")).toBeInTheDocument();
  });
});

describe("the game layout's strings for the result screen's tile", () => {
  it("adds the tile's strings to the root's, and none of the section's other strings", async () => {
    const errors = await renderGameLayout(<ArticlesStrings />, "de");

    expect(screen.getByTestId("tile")).toHaveTextContent("Als Nächstes lesen");
    expect(screen.getByTestId("nav")).toHaveTextContent("Artikel");
    expect(screen.getByTestId("like")).toHaveTextContent("articles.like.button");
    expect(errors).toEqual([expect.stringContaining("articles.like")]);
  });
});
