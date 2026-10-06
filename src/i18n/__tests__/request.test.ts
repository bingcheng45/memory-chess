import requestConfig from "@/i18n/request";
import german from "../../../messages/de.json";

// The real export is a server-only identity wrapper; the client build of
// next-intl that Jest resolves throws instead.
jest.mock("next-intl/server", () => ({ getRequestConfig: <T,>(build: T) => build }));

type Messages = {
  home: { hero: { title: string }; lab: { hero: { secondaryCta: string } } };
};

async function messagesFor(locale: string): Promise<Messages> {
  const config = await requestConfig({
    requestLocale: Promise.resolve(locale),
    locale: undefined,
  } as unknown as Parameters<typeof requestConfig>[0]);
  return config.messages as unknown as Messages;
}

describe("request messages", () => {
  it("serves the English home.lab block to a locale that has not translated it", async () => {
    const messages = await messagesFor("de");

    expect(messages.home.lab.hero.secondaryCta).toBe("Take a calibration reading");
    expect(messages.home.hero.title).toBe(german.home.hero.title);
  });
});
