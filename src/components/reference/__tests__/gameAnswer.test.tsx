/** @jest-environment node */
import { renderToString } from "react-dom/server";
import GameReference from "@/components/reference/GameReference";

jest.mock("next-intl/server", () => {
  const { createTranslator } = jest.requireActual("next-intl");

  return {
    getTranslations: ({ locale, namespace }: { locale: string; namespace: string }) =>
      Promise.resolve(createTranslator({ locale, messages: jest.requireActual(`../../../../messages/${locale}.json`), namespace })),
  };
});

const servedText = async (locale: string) =>
  renderToString(await GameReference({ locale }))
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");

const servedHtml = async (locale: string) => renderToString(await GameReference({ locale }));

describe("the chess memory test answer on /game", () => {
  it("serves the English answer with the recall data's numbers, dates and limits", async () => {
    const text = await servedText("en");

    expect(text).toContain(
      "A chess memory test shows you a position for a few seconds, then asks you to rebuild it on an empty board. It is the recall task Adriaan de Groot gave chess players in 1944, and William Chase and Herbert Simon's 1973 paper \"Perception in Chess\" is the standard reference for it.",
    );
    expect(text).toContain(
      "Your score is the share of the position's pieces placed that way, minus 10 points for each piece placed beyond the position's count, and never below 0.",
    );
    expect(text).toContain(
      "In 1,294 Memory Chess rounds set to 6 pieces and 10 seconds, played from September 29, 2026 to October 19, 2026, the average score was 48% and 11% of rounds were perfect. With 2 pieces the average was 82%, and with 12 pieces in 8 seconds it was 40%.",
    );
    expect(text).toContain("These are players who chose to play and chose the setting, not a sample of all chess players");
  });

  it("links the de Groot article and the data page from the English answer", async () => {
    const html = await servedHtml("en");

    expect(html).toContain('<a href="/articles/adriaan-de-groot">Adriaan de Groot</a>');
    expect(html).toContain('<a href="/data">The data page gives the method and every limit.</a>');
  });

  it("serves the German answer with German number and date forms and a German article link", async () => {
    const html = await servedHtml("de");
    const text = await servedText("de");

    expect(text).toContain("1.294");
    expect(text).toContain("29. September 2026");
    expect(text).toContain("48 %");
    expect(html).toContain('href="/de/articles/adriaan-de-groot"');
  });
});
