import type { AbstractIntlMessages } from "next-intl";

const ARTICLES_NAMESPACE = "articles";
const TILE_GROUP = "tile";

type ScopedMessages = {
  shared: AbstractIntlMessages;
  articles: AbstractIntlMessages[string];
};

/**
 * Parts the catalogue a layout sends to client components. The root layout
 * sends `shared` to every page, the articles layout adds `articles` for its
 * own routes and the game layout adds the group its result screen prints, so no
 * page carries strings it never shows. Server components read the whole
 * catalogue from the request and are not affected.
 */
export function splitArticlesNamespace(messages: AbstractIntlMessages): ScopedMessages {
  const { [ARTICLES_NAMESPACE]: articles, ...shared } = messages;

  return { shared, articles };
}

export function tileGroupOf(messages: AbstractIntlMessages): AbstractIntlMessages {
  const { articles } = splitArticlesNamespace(messages);
  const tile = typeof articles === "object" ? articles[TILE_GROUP] : undefined;
  if (typeof tile !== "object") throw new Error("The catalogue has no articles.tile group");

  return { [TILE_GROUP]: tile };
}
