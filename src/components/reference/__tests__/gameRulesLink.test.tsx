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

const served = async (locale: string) => renderToString(await GameReference({ locale }));

describe("the board game rules line on /game", () => {
  it("comes after the chess memory test answer, which stays the first text", async () => {
    const html = await served("en");

    expect(html.indexOf("A chess memory test shows you")).toBeGreaterThan(-1);
    expect(html.indexOf("A chess memory test shows you")).toBeLessThan(html.indexOf("Looking for the wooden Memory Chess board game?"));
  });

  it("links the English rules guide from the served HTML", async () => {
    const html = await served("en");

    expect(html).toContain("Looking for the wooden Memory Chess board game?");
    expect(html).toContain('href="/learn/how-to-play-memory-chess-board-game"');
    expect(html).toContain(">Read its rules</a>");
  });

  it("links the same guide in German and marks it as English", async () => {
    const html = await served("de");

    expect(html).toContain("Suchst du das Holzbrettspiel Memory Chess?");
    expect(html).toContain('hrefLang="en"');
    expect(html).toContain("Zu den Spielregeln");
    expect(html).toContain("(English)");
  });
});
