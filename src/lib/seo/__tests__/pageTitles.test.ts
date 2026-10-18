import { generateMetadata as gameMetadata } from "@/app/[locale]/game/layout";
import { generateMetadata as leaderboardMetadata } from "@/app/[locale]/leaderboard/layout";
import { generateMetadata as contactMetadata } from "@/app/[locale]/contact-us/layout";

jest.mock("next-intl/server", () => {
  const read = (locale: string, path: string) =>
    path.split(".").reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], jest.requireActual(`../../../../messages/${locale}.json`));
  return {
    getTranslations: async ({ locale, namespace }: { locale: string; namespace: string }) => (key: string) =>
      read(locale, `${namespace}.${key}`),
    getMessages: async () => ({}),
  };
});

jest.mock("@/components/reference/GameReference", () => () => null);
jest.mock("@/components/reference/LeaderboardReference", () => () => null);
jest.mock("@/components/reference/ContactReference", () => () => null);

const params = (locale: string) => ({ params: Promise.resolve({ locale }) });

describe("page titles name the brand once", () => {
  it("lets the English game title take the site suffix", async () => {
    expect((await gameMetadata(params("en"))).title).toBe("Chess Memory Game: Rebuild the Position");
  });

  it.each([
    ["de", "Memory Chess online spielen"],
    ["ru", "Играйте в Memory Chess онлайн"],
    ["zh-CN", "在线玩 Memory Chess"],
  ])("serves the %s game title without a second brand suffix", async (locale, title) => {
    expect((await gameMetadata(params(locale))).title).toEqual({ absolute: title });
  });

  it.each([
    ["en", "Memory Chess Leaderboard"],
    ["de", "Bestenliste von Memory Chess"],
  ])("serves the %s leaderboard title without a second brand suffix", async (locale, title) => {
    expect((await leaderboardMetadata(params(locale))).title).toEqual({ absolute: title });
  });

  it.each([
    ["en", "Contact Memory Chess"],
    ["de", "Memory Chess kontaktieren"],
    ["ja", "Memory Chess へのお問い合わせ"],
  ])("serves the %s contact title without a second brand suffix", async (locale, title) => {
    expect((await contactMetadata(params(locale))).title).toEqual({ absolute: title });
  });

  it("gives the English leaderboard a description between 120 and 155 characters", async () => {
    const { description } = await leaderboardMetadata(params("en"));

    expect(description).toBe(
      "See the top Memory Chess players on today's daily board and four difficulty levels, ranked by pieces recalled, mistakes, study time and solve time.",
    );
    expect(description).toHaveLength(147);
  });
});
