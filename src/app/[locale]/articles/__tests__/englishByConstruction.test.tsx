import type { ReactNode } from "react";
import { render, screen } from "@/test-utils/intl";
import ArticlesPage, { generateMetadata as listMetadata } from "@/app/[locale]/articles/page";
import ArticleRoute, {
  generateMetadata as articleMetadata,
  generateStaticParams,
} from "@/app/[locale]/articles/[slug]/page";
import ArticlePage from "@/components/articles/ArticlePage";
import { isServedAtBareEnglishUrl } from "@/lib/seo/englishOnly";
import { getArticleStats } from "@/lib/services/articleStatsService";

jest.mock("@/lib/articles/translatedLocales", () => ({ TRANSLATED_ARTICLE_LOCALES: [] }));

jest.mock("next-intl/server", () => ({
  setRequestLocale: jest.fn(),
  getTranslations: jest.fn(async ({ locale, namespace }: { locale: string; namespace: string }) => {
    const { createTranslator } = jest.requireActual("next-intl");
    const messages = jest.requireActual("../../../../../messages/en.json");
    return createTranslator({ locale, messages, namespace });
  }),
}));

jest.mock("next/navigation", () => ({
  ...jest.requireActual("next/navigation"),
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

jest.mock("@/lib/services/articleStatsService", () => ({
  getArticleStats: jest.fn(),
}));

jest.mock("@/components/articles/ArticleList", () => ({
  __esModule: true,
  default: jest.fn(({ heading }: { heading: ReactNode }) => <div>{heading}</div>),
}));

jest.mock("@/components/articles/ArticlePage", () => ({
  __esModule: true,
  default: jest.fn(() => <div />),
}));

jest.mock("@/components/ui/PageHeader", () => {
  function MockPageHeader() {
    return <div>PageHeader</div>;
  }

  return MockPageHeader;
});

const SLUG = "magnus-carlsen";
const ENGLISH_TITLE = "How Magnus Carlsen names a famous game from one position";
const ENGLISH_SEARCH_TITLE = "How Magnus Carlsen names a game from one position";

const listParams = (locale: string) => ({ params: Promise.resolve({ locale }) });
const articleParams = (locale: string) => ({ params: Promise.resolve({ slug: SLUG, locale }) });

describe("the English articles when no locale has a translation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getArticleStats).mockResolvedValue({ [SLUG]: { views: 120, likes: 7 } });
  });

  it("serves the English list, and no German one", async () => {
    render(await ArticlesPage(listParams("en")));

    expect(screen.getByRole("heading", { level: 1, name: "Articles" })).toBeInTheDocument();
    expect((await listMetadata(listParams("en"))).alternates).toStrictEqual({ canonical: "/articles" });
    await expect(ArticlesPage(listParams("de"))).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(listMetadata(listParams("de"))).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("serves an English article, and no German one", async () => {
    render(await ArticleRoute(articleParams("en")));

    expect(jest.mocked(ArticlePage).mock.calls[0][0].article.title).toBe(ENGLISH_TITLE);
    expect((await articleMetadata(articleParams("en"))).title).toBe(ENGLISH_SEARCH_TITLE);
    await expect(ArticleRoute(articleParams("de"))).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(articleMetadata(articleParams("de"))).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("prerenders the English articles, and no German one", () => {
    expect(generateStaticParams({ params: { locale: "en" } })).toContainEqual({ slug: SLUG });
    expect(generateStaticParams({ params: { locale: "de" } })).toEqual([]);
  });

  it("keeps the bare URL for English and sends German readers to it", () => {
    expect(isServedAtBareEnglishUrl("/articles", "en")).toBe(true);
    expect(isServedAtBareEnglishUrl("/articles/magnus-carlsen", "en")).toBe(true);
    expect(isServedAtBareEnglishUrl("/articles", "de")).toBe(true);
    expect(isServedAtBareEnglishUrl("/game", "en")).toBe(false);
  });
});
