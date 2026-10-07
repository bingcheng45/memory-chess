import { generateMetadata } from "@/app/[locale]/layout";

jest.mock("next-intl/server", () => ({
  ...jest.requireActual("next-intl/server"),
  getTranslations: async () => (key: string) => key,
}));

const metadataFor = (locale: string) => generateMetadata({ params: Promise.resolve({ locale }) });

describe("the locale layout's Open Graph URL", () => {
  it("keeps the English home at the bare domain", async () => {
    expect((await metadataFor("en")).openGraph).toMatchObject({ url: "https://thememorychess.com" });
  });

  it.each([
    ["de", "https://thememorychess.com/de"],
    ["pt-BR", "https://thememorychess.com/pt-BR"],
  ])("points the %s home at itself", async (locale, url) => {
    expect((await metadataFor(locale)).openGraph).toMatchObject({ url });
  });
});
