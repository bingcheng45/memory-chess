/** @jest-environment node */
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import GamePage from "@/app/[locale]/game/page";
import messages from "../../../../../messages/en.json";

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

    expect(html.match(/<h[1-6][^>]*>[^<]*/)?.[0]).toMatch(/^<h1[^>]*>Chess memory game$/);
    expect(html).toContain('aria-pressed="true"');
    expect(html).not.toContain("aria-busy");
    // The configuration screen keeps the site nav in the served HTML.
    expect(html).toContain("lab-header");
  });
});
