import { generateMetadata } from "@/app/[locale]/dashboard/layout";
import en from "../../../../../messages/en.json";

jest.mock("next-intl/server", () => ({
  getTranslations: async () => (key: "title" | "description") => en.dashboard.meta[key],
  getMessages: async () => ({}),
}));

describe("dashboard metadata", () => {
  it("names the page and keeps it out of the index while its links still count", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale: "en" }) });

    expect(metadata.title).toBe("Dashboard");
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});
