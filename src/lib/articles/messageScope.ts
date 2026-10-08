import type { AbstractIntlMessages } from "next-intl";

const ARTICLES_NAMESPACE = "articles";
const HOME_NAMESPACE = "home";
const LAB_GROUP = "lab";
const RESULT_CARD_GROUP = "resultCard";
const DAILY_GROUP = "daily";
const TILE_GROUP = "tile";

type ScopedMessages = {
  shared: AbstractIntlMessages;
  articles: AbstractIntlMessages[string];
  lab: AbstractIntlMessages;
  game: AbstractIntlMessages;
};

const underLab = (group: AbstractIntlMessages): AbstractIntlMessages => ({ [HOME_NAMESPACE]: { [LAB_GROUP]: group } });

/**
 * Parts the catalogue a layout sends to client components. The root layout
 * sends `shared` to every page, the articles layout adds `articles` for its
 * own routes, the home layout adds `home.lab` and the game layout adds the
 * lab groups /game prints, `home.lab.resultCard` on the result screen and
 * `home.lab.daily` where a second try at today's board is refused, so no page
 * carries strings it never shows.
 * Server components read the whole catalogue from the request and are not
 * affected.
 */
export function splitClientMessages(messages: AbstractIntlMessages): ScopedMessages {
  const { [ARTICLES_NAMESPACE]: articles, [HOME_NAMESPACE]: home, ...rest } = messages;
  const { [LAB_GROUP]: lab, ...homeShared } = typeof home === "object" ? home : {};
  const { [RESULT_CARD_GROUP]: resultCard, ...homeLab } = typeof lab === "object" ? lab : {};
  const daily = homeLab[DAILY_GROUP];

  return {
    shared: { ...rest, [HOME_NAMESPACE]: homeShared },
    articles,
    lab: lab === undefined ? {} : underLab(homeLab),
    game: resultCard === undefined ? {} : underLab({ [RESULT_CARD_GROUP]: resultCard, ...(daily !== undefined && { [DAILY_GROUP]: daily }) }),
  };
}

export function tileGroupOf(messages: AbstractIntlMessages): AbstractIntlMessages {
  const { articles } = splitClientMessages(messages);
  const tile = typeof articles === "object" ? articles[TILE_GROUP] : undefined;
  if (typeof tile !== "object") throw new Error("The catalogue has no articles.tile group");

  return { [TILE_GROUP]: tile };
}
