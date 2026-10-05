import type { AbstractIntlMessages } from "next-intl";

const ARTICLES_NAMESPACE = "articles";

type ScopedMessages = {
  shared: AbstractIntlMessages;
  articles: AbstractIntlMessages[string];
};

/**
 * Parts the catalogue a layout sends to client components. The root layout
 * sends `shared` to every page and the articles layout adds `articles` for its
 * own routes, so no other page carries strings it never shows. Server
 * components read the whole catalogue from the request and are not affected.
 */
export function splitArticlesNamespace(messages: AbstractIntlMessages): ScopedMessages {
  const { [ARTICLES_NAMESPACE]: articles, ...shared } = messages;

  return { shared, articles };
}
