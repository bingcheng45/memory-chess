import type { AbstractIntlMessages } from "next-intl";

const ARTICLES_NAMESPACE = "articles";
const HOME_NAMESPACE = "home";
const DASHBOARD_NAMESPACE = "dashboard";
const DAILY_NAMESPACE = "daily";
/** The /data page and its line on /about, which only server components print. */
const DATA_NAMESPACE = "data";
/** The daily page's metadata and explainer, which only server components print. */
const DAILY_SERVER_GROUPS: ReadonlySet<string> = new Set(["meta", "reference"]);
const LAB_GROUP = "lab";
const RESULT_CARD_GROUP = "resultCard";
const DAILY_GROUP = "daily";
const REVIEW_GROUP = "review";
const TILE_GROUP = "tile";
/** The dashboard's groups the result screen prints its figures with. */
const RESULT_FIGURE_GROUPS = ["label", "unit", "deltas"] as const;

type ScopedMessages = {
  shared: AbstractIntlMessages;
  articles: AbstractIntlMessages[string];
  lab: AbstractIntlMessages;
  game: AbstractIntlMessages;
  dashboard: AbstractIntlMessages;
  daily: AbstractIntlMessages;
};

const underLab = (group: AbstractIntlMessages): AbstractIntlMessages => ({ [HOME_NAMESPACE]: { [LAB_GROUP]: group } });

/**
 * Parts the catalogue a layout sends to client components. The root layout
 * sends `shared` to every page, the articles layout adds `articles` for its
 * own routes, the home layout adds `home.lab` and the game layout adds the
 * lab groups /game prints, `home.lab.resultCard` on the result screen, and
 * `home.lab.daily` and `home.lab.review` where a link to today's board or to a
 * review cannot open it, with the dashboard groups the result screen's figures
 * print in every locale and `daily.round` for a daily round in every locale, the
 * dashboard layout adds `dashboard`, and the daily layout adds `daily` less the
 * groups only its server components print, so no page carries strings it never
 * shows.
 * Server components read the whole catalogue from the request and are not
 * affected.
 */
export function splitClientMessages(messages: AbstractIntlMessages): ScopedMessages {
  const { [ARTICLES_NAMESPACE]: articles, [HOME_NAMESPACE]: home, [DASHBOARD_NAMESPACE]: dashboard, [DAILY_NAMESPACE]: dailyPage, ...rest } = messages;
  const { [LAB_GROUP]: lab, ...homeShared } = typeof home === "object" ? home : {};
  const { [RESULT_CARD_GROUP]: resultCard, ...homeLab } = typeof lab === "object" ? lab : {};
  const { [DAILY_GROUP]: daily, [REVIEW_GROUP]: review } = homeLab;
  const dailyClient = typeof dailyPage === "object" ? Object.fromEntries(Object.entries(dailyPage).filter(([group]) => !DAILY_SERVER_GROUPS.has(group))) : {};
  const figures = typeof dashboard === "object" ? Object.fromEntries(RESULT_FIGURE_GROUPS.flatMap((group) => (group in dashboard ? [[group, dashboard[group]]] : []))) : {};

  return {
    shared: { ...Object.fromEntries(Object.entries(rest).filter(([name]) => name !== DATA_NAMESPACE)), [HOME_NAMESPACE]: homeShared },
    articles,
    lab: lab === undefined ? {} : underLab(homeLab),
    game: {
      ...(resultCard !== undefined &&
        underLab({
          [RESULT_CARD_GROUP]: resultCard,
          ...(daily !== undefined && { [DAILY_GROUP]: daily }),
          ...(review !== undefined && { [REVIEW_GROUP]: review }),
        })),
      ...(Object.keys(figures).length > 0 && { [DASHBOARD_NAMESPACE]: figures }),
      ...(dailyClient.round !== undefined && { [DAILY_NAMESPACE]: { round: dailyClient.round } }),
    },
    dashboard: dashboard === undefined ? {} : { [DASHBOARD_NAMESPACE]: dashboard },
    daily: Object.keys(dailyClient).length > 0 ? { [DAILY_NAMESPACE]: dailyClient } : {},
  };
}

export function tileGroupOf(messages: AbstractIntlMessages): AbstractIntlMessages {
  const { articles } = splitClientMessages(messages);
  const tile = typeof articles === "object" ? articles[TILE_GROUP] : undefined;
  if (typeof tile !== "object") throw new Error("The catalogue has no articles.tile group");

  return { [TILE_GROUP]: tile };
}
