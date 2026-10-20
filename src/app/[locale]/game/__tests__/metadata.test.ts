import { generateMetadata } from "@/app/[locale]/game/layout";

jest.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
  getMessages: async () => ({}),
}));

jest.mock("@/components/reference/GameReference", () => () => null);

const SOCIAL_IMAGE = {
  url: "https://thememorychess.com/social/v2/memory-chess-1200x630.jpg",
  width: 1200,
  height: 630,
  type: "image/jpeg",
  alt: "Memory Chess: how many chess pieces can you remember? A chess position to study, then rebuild from memory.",
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
