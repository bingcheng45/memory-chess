import { setRequestLocale } from "next-intl/server";
import Home from "@/app/[locale]/(home)/page";
import { renderWithIntl, screen } from "@/test-utils/intl";
import english from "../../../../messages/en.json";
import german from "../../../../messages/de.json";
import japanese from "../../../../messages/ja.json";

// The switcher needs a mounted app router, which a test render does not have.
jest.mock("@/components/ui/LanguageSettings", () => function MockLanguageSettings() {
  return null;
});

jest.mock("next-intl/server", () => ({ ...jest.requireActual("next-intl/server"), setRequestLocale: jest.fn() }));

jest.mock("@/lib/services/totalPlays", () => ({
  getTotalPlays: async () => ({ plays: 49631, asOf: "2026-10-19T18:30:00.000Z" }),
}));

// A test render has no app router to read the path from.
jest.mock("@/i18n/navigation", () => ({ ...jest.requireActual("@/i18n/navigation"), usePathname: () => "/" }));

beforeEach(() => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: false } as Response));
});

describe("homepage locales", () => {
  it.each(["en", "de", "ja"])("fixes the request locale to %s before it renders, so static rendering does not lean on the layout", async (locale) => {
    await Home({ params: Promise.resolve({ locale }) });

    expect(setRequestLocale).toHaveBeenLastCalledWith(locale);
  });

  it("serves English the Brain Lab under its one heading", async () => {
    const { container } = renderWithIntl(await Home({ params: Promise.resolve({ locale: "en" }) }));

    await screen.findByRole("heading", { level: 1 });
    expect(container.querySelector(".lab-paper")).not.toBeNull();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Memory chess game · chess memory trainer Put a number on your mind's eye.",
    );
    expect(screen.getAllByText("Take a calibration reading").length).toBeGreaterThan(0);
    // jsdom has no IndexedDB, which the record reads as a window that cannot keep it.
    expect(await screen.findByText(/Not saved in private windows/, undefined, { timeout: 5000 })).toBeInTheDocument();
  });

  it.each([
    ["de", german],
    ["ja", japanese],
  ])("serves %s the Brain Lab in its own words", async (locale, messages) => {
    const { container } = renderWithIntl(await Home({ params: Promise.resolve({ locale }) }), { locale, messages });

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(messages.home.hero.title);
    expect(container.querySelector(".lab-paper")).not.toBeNull();
    expect(screen.getAllByText(messages.home.lab.hero.secondaryCta).length).toBeGreaterThan(0);
    expect(container.textContent).not.toContain(english.home.lab.hero.secondaryCta);
  });
});

describe("homepage play count", () => {
  it("shows the server's finished-game count before the browser's own request answers", async () => {
    global.fetch = jest.fn(() => new Promise<Response>(() => {}));
    renderWithIntl(await Home({ params: Promise.resolve({ locale: "en" }) }));

    const lead = document.querySelector(".lab-fact-lead");
    expect(lead?.textContent).toBe("49,631games played");
    expect(lead).not.toHaveAttribute("aria-busy", "true");
  });
});
