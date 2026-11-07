import { generateMetadata } from "@/app/[locale]/contact-us/layout";

jest.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));

jest.mock("@/components/reference/ContactReference", () => () => null);

const SOCIAL_IMAGE_URL = "https://thememorychess.com/social/v2/memory-chess-1200x630.jpg";

const metadataFor = (locale: string) => generateMetadata({ params: Promise.resolve({ locale }) });

describe("contact metadata", () => {
  it("keeps the English contact page indexable with no hreflang to translated pages", async () => {
    const metadata = await metadataFor("en");

    // An explicit `robots: undefined` would erase the root layout's index, follow tags, so the key must be absent.
    expect("robots" in metadata).toBe(false);
    expect(metadata.alternates).toEqual({ canonical: "/contact-us" });
  });

  it.each(["de", "ja", "pt-BR"])("marks the %s contact page noindex with a self canonical and no languages", async (locale) => {
    const metadata = await metadataFor(locale);

    expect(metadata.robots).toMatchObject({ index: false, follow: true, googleBot: { index: false } });
    expect(metadata.alternates).toEqual({ canonical: `/${locale}/contact-us` });
  });

  it("gives the contact page a large social card on its own URL", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale: "en" }) });

    expect(metadata.openGraph).toMatchObject({
      url: "https://thememorychess.com/contact-us",
      images: [expect.objectContaining({ url: SOCIAL_IMAGE_URL, width: 1200, height: 630 })],
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      images: [expect.objectContaining({ url: SOCIAL_IMAGE_URL })],
    });
  });
});
