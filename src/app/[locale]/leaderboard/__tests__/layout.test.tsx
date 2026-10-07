import { generateMetadata } from "@/app/[locale]/leaderboard/layout";

jest.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));

jest.mock("@/components/reference/LeaderboardReference", () => {
  function MockLeaderboardReference() {
    return null;
  }

  return MockLeaderboardReference;
});

const metadataFor = (locale: string) => generateMetadata({ params: Promise.resolve({ locale }) });

describe("leaderboard metadata", () => {
  it("keeps the English leaderboard indexable with no hreflang to translated boards", async () => {
    const metadata = await metadataFor("en");

    expect(metadata.robots).toBeUndefined();
    expect(metadata.alternates).toEqual({ canonical: "/leaderboard" });
  });

  it.each(["de", "ja", "pt-BR"])("marks the %s leaderboard noindex with a self canonical and no languages", async (locale) => {
    const metadata = await metadataFor(locale);

    expect(metadata.robots).toMatchObject({ index: false, follow: true, googleBot: { index: false } });
    expect(metadata.alternates).toEqual({ canonical: `/${locale}/leaderboard` });
  });
});

describe("leaderboard social card", () => {
  it("gives the leaderboard a large social card on its own URL", async () => {
    const metadata = await metadataFor("en");

    expect(metadata.openGraph).toMatchObject({
      url: "https://thememorychess.com/leaderboard",
      images: [expect.objectContaining({ url: "https://thememorychess.com/social-preview.png", width: 1200, height: 630 })],
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      images: [expect.objectContaining({ url: "https://thememorychess.com/social-preview.png" })],
    });
  });
});
