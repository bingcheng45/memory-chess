import type { AbstractIntlMessages } from "next-intl";

const ARTICLES_NAMESPACE = "articles";
const TILE_GROUP = "tile";

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

/**
 * The one part of `articles` a page outside the section prints: the game
 * route's result screen ends with the article tile. The game layout sends this
 * group alone, so the route carries none of the section's other strings.
 */
export function tileGroupOf(messages: AbstractIntlMessages): AbstractIntlMessages {
  const { articles } = splitArticlesNamespace(messages);
  if (typeof articles !== "object") throw new Error("The catalogue has no articles namespace");

  return { [TILE_GROUP]: articles[TILE_GROUP] };
}
