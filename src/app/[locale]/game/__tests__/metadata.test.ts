import { generateMetadata } from "@/app/[locale]/game/layout";

jest.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
  getMessages: async () => ({}),
}));

jest.mock("@/components/reference/GameReference", () => () => null);

const SOCIAL_IMAGE = {
  url: "https://thememorychess.com/social-preview.png",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: "Memory Chess knight and brain logo — thememorychess.com",
};

describe("game metadata", () => {
  it("gives the English game page a large social card on its own URL", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale: "en" }) });

    expect(metadata.openGraph).toMatchObject({ url: "https://thememorychess.com/game", images: [SOCIAL_IMAGE] });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image", images: [SOCIAL_IMAGE] });
  });

  it("points the German card at the German game page", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale: "de" }) });

    expect(metadata.openGraph).toMatchObject({ url: "https://thememorychess.com/de/game", images: [SOCIAL_IMAGE] });
  });
});
