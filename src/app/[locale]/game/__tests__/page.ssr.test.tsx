/** @jest-environment node */
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import GamePage from "@/app/[locale]/game/page";
import messages from "../../../../../messages/en.json";

jest.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/components/ui/PageHeader", () => {
  function MockPageHeader({ pageType }: { pageType?: string }) {
    return <div data-page-type={pageType} />;
  }
  return MockPageHeader;
});

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
    expect(html).toContain('data-page-type="other"');
  });
});
