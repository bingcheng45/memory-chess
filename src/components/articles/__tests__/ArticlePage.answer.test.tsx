/** @jest-environment node */
import type { ComponentProps } from "react";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import ArticlePage from "@/components/articles/ArticlePage";
import type { Locale } from "@/i18n/routing";
import { getArticle } from "@/lib/articles";

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
  usePathname: () => "/articles/adriaan-de-groot",
}));

jest.mock("@/components/lab-paper/LabPaperHeader", () => ({ LabPaperHeader: () => <div>LabPaperHeader</div> }));

async function firstBodyParagraph(locale: Locale): Promise<string | undefined> {
  const article = await getArticle("adriaan-de-groot", locale);
  if (!article) throw new Error("no de Groot article");
  const messages = jest.requireActual(`../../../../messages/${locale}.json`);
  const html = renderToString(
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      <ArticlePage article={article} />
    </NextIntlClientProvider>,
  ).replace(/<!-- -->/g, "");
  const body = html.slice(html.indexOf("data-article-body"));
  return body.match(/<p class="art-body-p">([^<]*)<\/p>/)?.[1].replace(/&#x27;/g, "'");
}

describe("the de Groot article opens with its answer", () => {
  it("serves the English answer as the first paragraph of the body", async () => {
    expect(await firstBodyParagraph("en")).toBe(
      "Grandmasters remember a position from a real game as a few familiar groups of pieces, the chunks William Chase and Herbert Simon measured in 1973, rather than square by square. In Adriaan de Groot's 1944 test, world champion Max Euwe saw a 22-piece position for 5 seconds and got all 22 pieces right, while a weaker class player scored 9. On random boards the edge shrinks to about one extra piece per 400 Elo points, against about five on positions from games, as Fernand Gobet and Herbert Simon found in 1996.",
    );
  });

  it("serves the reviewed German answer as the first paragraph of the German body", async () => {
    expect(await firstBodyParagraph("de")).toBe(
      "Großmeister behalten eine Stellung aus einer echten Partie nicht Feld für Feld, sondern als wenige vertraute Figurengruppen, jene Chunks, die William Chase und Herbert Simon 1973 gemessen haben. In Adriaan de Groots Test von 1944 sah Weltmeister Max Euwe eine Stellung mit 22 Figuren 5 Sekunden lang und hatte alle 22 Figuren richtig, während ein Spieler aus einer schwächeren Klasse auf 9 kam. Bei Zufallsstellungen schrumpft der Vorsprung auf etwa eine zusätzliche Figur je 400 Elo-Punkte, gegenüber etwa fünf bei Stellungen aus Partien. Das fanden Fernand Gobet und Herbert Simon 1996 heraus.",
    );
  });
});
