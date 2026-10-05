import { isValidElement, type ReactElement, type ReactNode } from "react";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import LocaleLayout from "@/app/[locale]/layout";

function collect(node: ReactNode, match: (element: ReactElement) => boolean): ReactElement[] {
  if (Array.isArray(node)) return node.flatMap((child) => collect(child, match));
  if (!isValidElement(node)) return [];
  const element = node as ReactElement<{ children?: ReactNode }>;
  return [...(match(element) ? [element] : []), ...collect(element.props.children, match)];
}

/**
 * The messages the locale layout hands the client components of every page.
 * The layout is read, not rendered: it returns `<html>`, which a test
 * container cannot hold. The caller mocks `getMessages` and
 * `setRequestLocale` of `next-intl/server`.
 */
export async function localeLayoutClientMessages(locale: string): Promise<AbstractIntlMessages> {
  const tree = await LocaleLayout({ children: null, params: Promise.resolve({ locale }) });
  const [provider] = collect(tree, (element) => element.type === NextIntlClientProvider);

  return (provider.props as { messages: AbstractIntlMessages }).messages;
}
