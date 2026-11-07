import { generateMetadata } from "@/app/[locale]/daily/layout";

jest.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
  getMessages: async () => ({}),
}));

const metadataFor = (locale: string) => generateMetadata({ params: Promise.resolve({ locale }) });

describe("daily board metadata", () => {
  it("keeps the English daily board indexable with no hreflang to translated boards", async () => {
    const metadata = await metadataFor("en");

    // An explicit `robots: undefined` would erase the root layout's index, follow tags, so the key must be absent.
    expect("robots" in metadata).toBe(false);
    expect(metadata.alternates).toEqual({ canonical: "/daily" });
  });

  it.each(["de", "ja", "pt-BR"])("marks the %s daily board noindex with a self canonical and no languages", async (locale) => {
    const metadata = await metadataFor(locale);

    expect(metadata.robots).toMatchObject({ index: false, follow: true, googleBot: { index: false } });
    expect(metadata.alternates).toEqual({ canonical: `/${locale}/daily` });
  });
});
