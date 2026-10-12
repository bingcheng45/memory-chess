import { readFileSync } from "node:fs";
import { join } from "node:path";
import { generateMetadata, viewport } from "@/app/[locale]/layout";

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

describe("the browser chrome", () => {
  it("takes the Lab Paper page colour and a light scheme on every route", async () => {
    const css = readFileSync(join(process.cwd(), "src/components/lab-paper/lab-paper.css"), "utf8");
    const paper = css.match(/--lp-paper: (#[0-9a-f]{6})/)?.[1];

    expect(paper).toBe("#f5f8f7");
    expect(viewport).toMatchObject({ themeColor: paper, colorScheme: "light" });
    expect((await metadataFor("en")).appleWebApp).toMatchObject({ statusBarStyle: "default" });
  });
});
