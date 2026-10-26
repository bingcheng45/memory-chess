/** @jest-environment node */
import type { ComponentProps } from "react";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import BlindfoldPage, { generateMetadata } from "@/app/[locale]/blindfold/page";
import sitemap from "@/app/sitemap";
import messages from "../../../../../messages/en.json";

jest.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: ComponentProps<"a">) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
}));
jest.mock("next-intl/server", () => ({ ...jest.requireActual("next-intl/server"), setRequestLocale: jest.fn() }));
jest.mock("@/components/lab-paper/LabPaperHeader", () => ({ LabPaperHeader: () => <div>LabPaperHeader</div> }));

const markup = renderToString(
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    <BlindfoldPage />
  </NextIntlClientProvider>,
).replace(/<!-- -->/g, "");

describe("the blindfold page", () => {
  it("is its own canonical with the agreed title and description", () => {
    const meta = generateMetadata();

    expect(meta.title).toEqual({ absolute: "Blindfold Chess Trainer: Free Online Practice | Memory Chess" });
    expect(meta.description).toBe(
      "Train blindfold chess in your browser. Study a position as notation, then rebuild it square by square. Free, no sign-up, with its own leaderboard.",
    );
    expect(meta.alternates?.canonical).toBe("/blindfold");
  });

  it("serves one h1 and a start link that opens a blindfold round", () => {
    expect(markup.match(/<h1>(.*?)<\/h1>/)?.[1]).toBe("Blindfold chess trainer");
    expect(markup).toContain('href="/game?pieceCount=6&amp;memorizeTime=10&amp;from=link&amp;mode=blindfold"');
    expect(markup).toContain('href="/game?mode=blindfold"');
  });

  it("links the guide and the board game rules", () => {
    expect(markup).toContain('href="/learn/blindfold-chess-training-for-beginners"');
    expect(markup).toContain('href="/learn/how-to-play-memory-chess-board-game"');
  });

  it("is listed once in the sitemap at its bare URL", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls.filter((url) => url.endsWith("/blindfold"))).toEqual(["https://thememorychess.com/blindfold"]);
  });
});
