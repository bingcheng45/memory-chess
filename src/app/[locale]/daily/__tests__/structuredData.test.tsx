/** @jest-environment node */
import { renderToStaticMarkup } from "react-dom/server";
import DailyPage from "@/app/[locale]/daily/page";

jest.mock("next-intl/server", () => {
  const read = (locale: string, path: string) =>
    path.split(".").reduce((node, key) => node[key], jest.requireActual(`../../../../../messages/${locale}.json`));
  return {
    getTranslations: async ({ locale }: { locale: string }) => (key: string) => read(locale, key),
  };
});

jest.mock("@/components/lab-paper/LabPaperHeader", () => ({ LabPaperHeader: () => null }));
jest.mock("@/components/daily/DailyBoard", () => ({ DailyBoard: () => null }));
jest.mock("@/components/daily/DailyReference", () => ({ DailyReference: () => null }));

async function graphFor(locale: string) {
  const markup = renderToStaticMarkup(await DailyPage({ params: Promise.resolve({ locale }) }));
  const json = markup.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? "{}";
  return JSON.parse(json)["@graph"];
}

describe("daily page structured data", () => {
  it("describes the English daily board as a WebPage with a breadcrumb from the home page", async () => {
    expect(await graphFor("en")).toEqual([
      {
        "@type": "WebPage",
        "@id": "https://thememorychess.com/daily#webpage",
        url: "https://thememorychess.com/daily",
        name: "Daily Chess Memory Board: One Position for Everyone",
        description:
          "One chess memory board a day, the same position for every player. Study it once, rebuild it, and join today's top 10. A new board opens at midnight UTC.",
        inLanguage: "en-US",
        isPartOf: { "@id": "https://thememorychess.com/#website" },
        breadcrumb: { "@id": "https://thememorychess.com/daily#breadcrumb" },
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://thememorychess.com/daily#breadcrumb",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Memory Chess", item: "https://thememorychess.com" },
          { "@type": "ListItem", position: 2, name: "Daily board", item: "https://thememorychess.com/daily" },
        ],
      },
    ]);
  });

  it("names the German page and crumb in German at the German URL", async () => {
    const [page, breadcrumb] = await graphFor("de");

    expect(page).toMatchObject({ url: "https://thememorychess.com/de/daily", inLanguage: "de" });
    expect(breadcrumb.itemListElement[1]).toEqual({
      "@type": "ListItem",
      position: 2,
      name: "Tagesbrett",
      item: "https://thememorychess.com/de/daily",
    });
  });
});
