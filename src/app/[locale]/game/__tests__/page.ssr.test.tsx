/** @jest-environment node */
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import GamePage from "@/app/[locale]/game/page";
import messages from "../../../../../messages/en.json";

jest.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/components/ui/PageHeader", () => {
  function MockPageHeader() {
    return <div />;
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

    expect(html).toContain("Game Configuration</h2>");
    expect(html).toContain('aria-pressed="true"');
    expect(html).not.toContain("aria-busy");
  });
});
