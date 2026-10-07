import requestConfig from "@/i18n/request";
import english from "../../../messages/en.json";
import german from "../../../messages/de.json";

// The real export is a server-only identity wrapper; the client build of
// next-intl that Jest resolves throws instead.
jest.mock("next-intl/server", () => ({ getRequestConfig: <T,>(build: T) => build }));

type Messages = { home: { hero: { title: string }; lab?: unknown } };

async function messagesFor(locale: string): Promise<Messages> {
  const config = await requestConfig({
    requestLocale: Promise.resolve(locale),
    locale: undefined,
  } as unknown as Parameters<typeof requestConfig>[0]);
  return config.messages as unknown as Messages;
}

describe("request messages", () => {
  it("serves a locale its own catalogue, with no English lab copy mixed in", async () => {
    const messages = await messagesFor("de");

    expect(messages.home.lab).toBeUndefined();
    expect(messages.home.hero.title).toBe(german.home.hero.title);
  });

  it("serves English its lab copy", async () => {
    expect((await messagesFor("en")).home.lab).toEqual(english.home.lab);
  });
});
