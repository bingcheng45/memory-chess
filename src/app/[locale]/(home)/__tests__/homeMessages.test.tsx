import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import HomeLayout from "@/app/[locale]/(home)/layout";
import Home from "@/app/[locale]/(home)/page";
import { LOCALES } from "@/i18n/routing";
import { localeLayoutClientMessages } from "@/test-utils/localeLayoutMessages";

jest.mock("next-intl/server", () => ({
  ...jest.requireActual("next-intl/server"),
  setRequestLocale: jest.fn(),
  getMessages: jest.fn(async ({ locale }: { locale: string }) =>
    jest.requireActual(`../../../../../messages/${locale}.json`),
  ),
}));

jest.mock("@/lib/services/totalPlays", () => ({ getTotalPlays: async () => null }));

// The switcher needs a mounted app router, which a test render does not have.
jest.mock("@/i18n/navigation", () => ({ ...jest.requireActual("@/i18n/navigation"), usePathname: () => "/" }));

jest.mock("@/components/ui/LanguageSettings", () => function MockLanguageSettings() {
  return null;
});

const RAW_MESSAGE_KEY = /\bhome\.[a-z]+\.[A-Za-z.]+/;

async function renderHome(locale: string) {
  const missing: string[] = [];
  const rootMessages = await localeLayoutClientMessages(locale);
  const homeLayout = await HomeLayout({ children: await Home({ params: Promise.resolve({ locale }) }), params: Promise.resolve({ locale }) });

  const { container } = render(
    <NextIntlClientProvider locale={locale} messages={rootMessages} onError={(error) => missing.push(error.message)}>
      {homeLayout}
    </NextIntlClientProvider>,
  );

  return { missing, container };
}

beforeEach(() => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: false } as Response));
});

describe("the home page under the messages its route's layouts send", () => {
  it("prints the lab in English from the home layout's own group", async () => {
    const { missing, container } = await renderHome("en");

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "Memory chess game · chess memory trainer Put a number on your mind's eye.",
    );
    expect(screen.getByRole("heading", { name: "Take a calibration reading." })).toBeInTheDocument();
    expect(missing).toEqual([]);
    expect(container.textContent).not.toMatch(RAW_MESSAGE_KEY);
  });

  it.each(LOCALES.filter((locale) => locale !== "en"))("prints the lab in %s with no missing or raw keys", async (locale) => {
    const { home } = jest.requireActual(`../../../../../messages/${locale}.json`);
    const { missing, container } = await renderHome(locale);

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(home.hero.title);
    expect(screen.getByRole("heading", { name: home.lab.calibrate.title })).toBeInTheDocument();
    expect(missing).toEqual([]);
    expect(container.textContent).not.toMatch(RAW_MESSAGE_KEY);
  });
});
