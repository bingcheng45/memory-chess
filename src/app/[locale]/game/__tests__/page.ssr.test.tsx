/** @jest-environment node */
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import GamePage from "@/app/[locale]/game/page";
import messages from "../../../../../messages/en.json";
import deMessages from "../../../../../messages/de.json";

jest.mock("@/i18n/navigation", () => ({
  usePathname: () => "/game",
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

describe("GamePage server render", () => {
  it("renders the configuration form rather than a loading fallback", () => {
    jest.spyOn(console, "log").mockImplementation(() => {});

    const html = renderToString(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <GamePage />
      </NextIntlClientProvider>,
    );

    expect(html.match(/<h[1-6][^>]*>[^<]*/)?.[0]).toMatch(/^<h1[^>]*>Memory chess game$/);
    expect(html).toContain('aria-pressed="true"');
    expect(html).not.toContain("aria-busy");
    // The configuration screen keeps the site nav in the served HTML.
    expect(html).toContain("lab-header");
  });
  const structuredData = (locale: string, catalogue: typeof messages) => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    const html = renderToString(
      <NextIntlClientProvider locale={locale} messages={catalogue} timeZone="UTC">
        <GamePage />
      </NextIntlClientProvider>,
    );
    return [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
  };

  it("serves the game as a WebApplication in the page's language", () => {
    expect(structuredData("en", messages)).toEqual([
      expect.objectContaining({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "@id": "https://thememorychess.com/game#app",
        name: "Chess Memory Game: Rebuild the Position",
        url: "https://thememorychess.com/game",
        inLanguage: "en-US",
        description:
          "Start a chess memory game in one tap. Memorize a position, rebuild it square by square, and see your accuracy. Pick 2 to 32 pieces and 1 to 60 seconds.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      }),
    ]);
    expect(structuredData("de", deMessages)).toEqual([
      expect.objectContaining({ url: "https://thememorychess.com/de/game", inLanguage: "de", name: "Memory Chess online spielen" }),
    ]);
  });
});
