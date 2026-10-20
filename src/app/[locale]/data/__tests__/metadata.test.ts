import { generateMetadata } from "@/app/[locale]/data/page";
import { LOCALES } from "@/i18n/routing";

jest.mock("next-intl/server", () => {
  const { createTranslator } = jest.requireActual("next-intl");
  return {
    getTranslations: async ({ locale, namespace }: { locale: string; namespace: string }) =>
      createTranslator({ locale, messages: jest.requireActual(`../../../../../messages/${locale}.json`), namespace }),
  };
});

jest.mock("@/lib/data/recall", () => {
  const actual = jest.requireActual("@/lib/data/recall");
  return { ...actual, RECALL_DATA: { ...actual.RECALL_DATA, totalRounds: 99_999 } };
});

const rendered = (title: unknown) =>
  typeof title === "object" && title !== null && "absolute" in title ? String(title.absolute) : `${title} | Memory Chess`;

it("serves the English title and description with room for five-digit round counts", async () => {
  const { title, description } = await generateMetadata({ params: Promise.resolve({ locale: "en" }) });

  expect(rendered(title)).toBe("How well do people remember chess positions? | Memory Chess");
  expect(description).toBe(
    "Average chess position recall by piece count and study time, from 99,999 finished rounds of Memory Chess. Open CC BY 4.0 data with its method and limits.",
  );
});

it.each(LOCALES)("keeps the %s title within 60 characters and the description within 155", async (locale) => {
  const { title, description } = await generateMetadata({ params: Promise.resolve({ locale }) });

  expect([rendered(title).length <= 60, String(description).length <= 155]).toEqual([true, true]);
});
