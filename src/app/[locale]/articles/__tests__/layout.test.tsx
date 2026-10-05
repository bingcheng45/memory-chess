import type { ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider, useFormatter, useLocale, useNow, useTranslations } from "next-intl";
import ArticlesLayout from "@/app/[locale]/articles/layout";
import ArticlePager from "@/components/articles/ArticlePager";
import { paginate } from "@/lib/articles/paging";

jest.mock("next-intl/server", () => ({
  ...jest.requireActual("next-intl/server"),
  getMessages: jest.fn(async ({ locale }: { locale: string }) =>
    locale === "de"
      ? jest.requireActual("@/components/articles/__tests__/chromeCatalogues").GERMAN_MESSAGES
      : jest.requireActual("../../../../../messages/en.json"),
  ),
}));

jest.mock("next/navigation", () => ({
  ...jest.requireActual("next/navigation"),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn(), back: jest.fn() }),
  usePathname: () => "/de/articles",
  useSearchParams: () => new URLSearchParams(),
}));

// What the root layout sends: no `articles` namespace. The catalogue the
// articles layout reads has "Articles" under this key, so "Artikel" on the
// page can only have come from here.
const ROOT_MESSAGES = { common: { nav: { articles: "Artikel" } } };
const ROOT_FORMATS = { dateTime: { yearOnly: { year: "numeric" } } } as const;
const NEW_YEAR_IN_TOKYO = new Date("2026-12-31T20:00:00Z");
const TWELVE_ARTICLES = Array.from({ length: 12 }, (_, index) => index);

function LikeLabel() {
  return <p data-testid="like">{useTranslations("articles.like")("button")}</p>;
}

function NavLabel() {
  return <p data-testid="nav">{useTranslations("common.nav")("articles")}</p>;
}

function Inherited() {
  const format = useFormatter();
  return <p data-testid="inherited">{`${useLocale()} ${format.dateTime(useNow(), "yearOnly")}`}</p>;
}

function renderUnderRoot(children: ReactNode, locale: string) {
  const errors: string[] = [];
  const view = render(
    <NextIntlClientProvider
      locale={locale}
      messages={ROOT_MESSAGES}
      formats={ROOT_FORMATS}
      timeZone="Asia/Tokyo"
      now={NEW_YEAR_IN_TOKYO}
      onError={(error) => errors.push(error.code)}
    >
      {children}
    </NextIntlClientProvider>,
  );

  return { errors, page: within(view.container) };
}

async function inArticlesLayout(children: ReactNode, locale: string) {
  return ArticlesLayout({ children, params: Promise.resolve({ locale }) });
}

describe("the articles layout", () => {
  it("gives a client component the articles strings, which the root does not send", async () => {
    const outside = renderUnderRoot(<LikeLabel />, "de");
    const inside = renderUnderRoot(await inArticlesLayout(<LikeLabel />, "de"), "de");

    expect(outside.errors).toEqual(["MISSING_MESSAGE"]);
    expect(outside.page.getByTestId("like")).toHaveTextContent("articles.like.button");
    expect(inside.errors).toEqual([]);
    expect(inside.page.getByTestId("like")).toHaveTextContent("Artikel empfehlen");
  });

  it("reads them in the language of the page", async () => {
    const { errors } = renderUnderRoot(await inArticlesLayout(<LikeLabel />, "en"), "en");

    expect(errors).toEqual([]);
    expect(screen.getByTestId("like")).toHaveTextContent("Like this article");
  });

  it("keeps the root's strings, and takes them from the root instead of a second copy", async () => {
    const { errors } = renderUnderRoot(await inArticlesLayout(<NavLabel />, "de"), "de");

    expect(errors).toEqual([]);
    expect(screen.getByTestId("nav")).toHaveTextContent("Artikel");
  });

  it("inherits the root's locale, time zone, clock and formats", async () => {
    renderUnderRoot(await inArticlesLayout(<Inherited />, "de"), "de");

    expect(screen.getByTestId("inherited")).toHaveTextContent("de 2027");
  });

  it("gives the pager its labels, which no browser check reaches until there are eleven articles", async () => {
    const pager = <ArticlePager current={paginate(TWELVE_ARTICLES, 1)} total={12} />;
    const { errors } = renderUnderRoot(await inArticlesLayout(pager, "de"), "de");
    const nav = screen.getByRole("navigation", { name: "Seiten" });

    expect(errors).toEqual([]);
    expect(within(nav).getByText("1 bis 10 von 12")).toBeInTheDocument();
    expect(within(nav).getAllByRole("button").map((button) => button.getAttribute("aria-label"))).toEqual([
      "Vorherige Seite",
      "Seite 1",
      "Seite 2",
      "Nächste Seite",
    ]);
  });
});
