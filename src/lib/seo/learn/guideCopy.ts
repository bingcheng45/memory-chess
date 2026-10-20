import { IntlMessageFormat } from "intl-messageformat";
import en from "../../../../messages/en.json";
import GUIDE_CHROME, { type GuideChrome } from "./guideChrome";
import type { LearnGroupId, LearnLevel } from "./schema";

type Values = Record<string, string | number>;

export function guideCopyOf(locale: string, chrome: GuideChrome, statLabels: Readonly<Record<string, string>>) {
  const format = (message: string, values: Values) => String(new IntlMessageFormat(message, locale).format(values));
  const dateFormat = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return {
    ...chrome,
    chrome,
    level: (level: LearnLevel) => chrome.levels[level],
    group: (id: LearnGroupId) => chrome.groups[id],
    date: (iso: string) => dateFormat.format(new Date(iso)),
    minRead: (minutes: number) => format(chrome.minRead, { minutes }),
    updated: (date: string) => format(chrome.updated, { date }),
    checked: (date: string) => format(chrome.checked, { date }),
    figure: (n: number) => format(chrome.figure, { n }),
    toMove: (side: "w" | "b") => (side === "w" ? chrome.whiteToMove : chrome.blackToMove),
    pieces: (count: number) => format(chrome.pieces, { count }),
    secondsToLook: (seconds: number) => format(chrome.secondsToLook, { seconds }),
    tryRound: (pieces: number, seconds: number) => format(chrome.tryRound, { pieces, seconds }),
    statLabel: (tile: string) => statLabels[tile] ?? tile,
  };
}

export type GuideCopy = ReturnType<typeof guideCopyOf>;

export const LEARN_GUIDE_COPY: GuideCopy = guideCopyOf("en", GUIDE_CHROME, en.dashboard.label);
