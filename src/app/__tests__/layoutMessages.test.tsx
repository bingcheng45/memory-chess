import type { ReactElement, ReactNode } from "react";
import { isValidElement } from "react";
import { NextIntlClientProvider } from "next-intl";
import LocaleLayout from "@/app/[locale]/layout";

jest.mock("next-intl/server", () => ({
  ...jest.requireActual("next-intl/server"),
  setRequestLocale: jest.fn(),
  getMessages: jest.fn(async ({ locale }: { locale: string }) => ({
    common: { nav: { articles: locale === "de" ? "Artikel" : "Articles" } },
    game: { skip: locale === "de" ? "Überspringen" : "Skip" },
    articles: { like: { button: locale === "de" ? "Artikel empfehlen" : "Recommend this article" } },
  })),
}));

function collect(node: ReactNode, match: (element: ReactElement) => boolean): ReactElement[] {
  if (Array.isArray(node)) return node.flatMap((child) => collect(child, match));
  if (!isValidElement(node)) return [];
  const element = node as ReactElement<{ children?: ReactNode }>;
  return [...(match(element) ? [element] : []), ...collect(element.props.children, match)];
}

async function clientMessagesIn(locale: string): Promise<unknown> {
  const tree = await LocaleLayout({ children: <div />, params: Promise.resolve({ locale }) });
  const [provider] = collect(tree, (element) => element.type === NextIntlClientProvider);

  return (provider.props as { messages: unknown }).messages;
}

describe("the messages the locale layout sends to every page", () => {
  it("are every namespace of the page's language but the articles", async () => {
    expect(await clientMessagesIn("de")).toEqual({
      common: { nav: { articles: "Artikel" } },
      game: { skip: "Überspringen" },
    });
    expect(await clientMessagesIn("en")).toEqual({
      common: { nav: { articles: "Articles" } },
      game: { skip: "Skip" },
    });
  });
});
