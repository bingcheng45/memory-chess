import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import HomeLayout from "@/app/[locale]/(home)/layout";
import Home from "@/app/[locale]/(home)/page";
import { localeLayoutClientMessages } from "@/test-utils/localeLayoutMessages";

jest.mock("next-intl/server", () => ({
  ...jest.requireActual("next-intl/server"),
  setRequestLocale: jest.fn(),
  getMessages: jest.fn(async ({ locale }: { locale: string }) =>
    jest.requireActual(`../../../../../messages/${locale}.json`),
  ),
}));

jest.mock("@/components/ui/PageHeader", () => {
  function MockPageHeader() {
    return null;
  }

  return MockPageHeader;
});

const RAW_MESSAGE_KEY = /\bhome\.[a-z]+\.[A-Za-z.]+/;

async function renderHome(locale: string) {
  const missing: string[] = [];
  const rootMessages = await localeLayoutClientMessages(locale);
  const homeLayout = await HomeLayout({
    children: await Home({ params: Promise.resolve({ locale }) }),
    params: Promise.resolve({ locale }),
  });

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

    expect(missing).toEqual([]);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Memory chess game · chess memory trainer Put a number on your mind's eye.",
    );
    expect(screen.getByRole("heading", { name: "Take a calibration reading." })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(RAW_MESSAGE_KEY);
  });

  it.each([
    ["de", "Memory Chess: Trainiere dein Schachgedächtnis und deine Vorstellungskraft"],
    ["ja", "Memory Chess: チェスの記憶力とイメージ力を鍛える"],
  ])("prints the earlier homepage in %s with no raw keys", async (locale, title) => {
    const { missing, container } = await renderHome(locale);

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(title);
    expect(missing).toEqual([]);
    expect(container.textContent).not.toMatch(RAW_MESSAGE_KEY);
  });
});
