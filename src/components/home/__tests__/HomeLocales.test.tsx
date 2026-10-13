import Home from "@/app/[locale]/(home)/page";
import { renderWithIntl, screen } from "@/test-utils/intl";
import english from "../../../../messages/en.json";
import german from "../../../../messages/de.json";
import japanese from "../../../../messages/ja.json";

// The switcher needs a mounted app router, which a test render does not have.
jest.mock("@/components/ui/LanguageSettings", () => function MockLanguageSettings() {
  return null;
});

// A test render has no app router to read the path from.
jest.mock("@/i18n/navigation", () => ({ ...jest.requireActual("@/i18n/navigation"), usePathname: () => "/" }));

beforeEach(() => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: false } as Response));
});

describe("homepage locales", () => {
  it("serves English the Brain Lab under its one heading", async () => {
    const { container } = renderWithIntl(Home());

    await screen.findByRole("heading", { level: 1 });
    expect(container.querySelector(".lab-paper")).not.toBeNull();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Memory chess game · chess memory trainer Put a number on your mind's eye.",
    );
    expect(screen.getAllByText("Take a calibration reading").length).toBeGreaterThan(0);
    // jsdom has no IndexedDB, which the record reads as a window that cannot keep it.
    expect(await screen.findByText(/Not saved in private windows/)).toBeInTheDocument();
  });

  it.each([
    ["de", german],
    ["ja", japanese],
  ])("serves %s the Brain Lab in its own words", async (locale, messages) => {
    const { container } = renderWithIntl(Home(), { locale, messages });

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(messages.home.hero.title);
    expect(container.querySelector(".lab-paper")).not.toBeNull();
    expect(screen.getAllByText(messages.home.lab.hero.secondaryCta).length).toBeGreaterThan(0);
    expect(container.textContent).not.toContain(english.home.lab.hero.secondaryCta);
  });
});
