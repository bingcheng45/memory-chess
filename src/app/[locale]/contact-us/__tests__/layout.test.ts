import { generateMetadata } from "@/app/[locale]/contact-us/layout";

jest.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));

jest.mock("@/components/reference/ContactReference", () => () => null);

const SOCIAL_IMAGE_URL = "https://thememorychess.com/social-preview.png";

describe("contact metadata", () => {
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
