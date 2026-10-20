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

jest.mock("@/lib/data/recall", () => {
  const cell = (pieceCount: number, memorizeSeconds: number, rounds: number, meanAccuracy: number, perfectShare: number) => ({
    pieceCount,
    memorizeSeconds,
    rounds,
    players: 20,
    meanAccuracy,
    medianAccuracy: 50,
    p25Accuracy: 25,
    p75Accuracy: 75,
    perfectShare,
    zeroShare: 5,
  });

  return {
    ...jest.requireActual("@/lib/data/recall"),
    RECALL_DATA: {
      start: "2026-08-11",
      end: "2026-09-08",
      minRounds: 30,
      minPlayers: 5,
      totalRounds: 3000,
      totalPlayers: 400,
      roundsWithoutSettings: 10,
      roundsInSmallCells: 90,
      publishedRounds: 2900,
      cells: [cell(2, 10, 310, 79.4, 70.2), cell(6, 10, 2345, 51.2, 9.6), cell(12, 8, 45, 37.4, 1.1)],
    },
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
      "In 2,345 Memory Chess rounds set to 6 pieces and 10 seconds, played from August 11, 2026 to September 8, 2026, the average score was 51% and 10% of rounds were perfect. With 2 pieces the average was 79% across 310 rounds, and with 12 pieces in 8 seconds it was 37% across 45 rounds.",
    );
    expect(text).toContain("These are players who chose to play and chose the setting, not a sample of all chess players");
  });

  it("links the de Groot article and the data page from the English answer", async () => {
    const html = await servedHtml("en");

    expect(html).toContain('<a href="/articles/adriaan-de-groot">Adriaan de Groot</a>');
    expect(html).toContain('<a href="/data">The data page gives the method and every limit.</a>');
  });

  it("serves the German answer with German number and date forms and German article and data links", async () => {
    const html = await servedHtml("de");
    const text = await servedText("de");

    expect(text).toContain(
      "In 2.345 Runden Memory Chess mit 6 Figuren und 10 Sekunden Einprägezeit, gespielt vom 11. August 2026 bis zum 8. September 2026, lag die Genauigkeit im Schnitt bei 51\u00a0%, und 10\u00a0% der Runden waren fehlerfrei. Mit 2 Figuren lag der Schnitt bei 79\u00a0% (310 Runden), mit 12 Figuren in 8 Sekunden bei 37\u00a0% (45 Runden).",
    );
    expect(html).toContain('href="/de/articles/adriaan-de-groot"');
    expect(html).toContain('<a href="/de/data">Die Datenseite');
  });

  it("writes an Italian date range that reads right when it starts on the 11th and ends on the 8th", async () => {
    expect(await servedText("it")).toContain("giocati nel periodo 11 agosto 2026 - 8 settembre 2026,");
  });
});
