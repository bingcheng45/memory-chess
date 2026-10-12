import { createTranslator } from "next-intl";
import { shareCaption, type DashboardTranslate } from "@/components/dashboard/shareCaption";
import { resultCaption, type ResultTranslate, type RoundShare } from "@/components/game/roundShare";
import { LOCALES } from "@/i18n/routing";
import type { ShareCard } from "@/lib/lab/dashboard";
import { labPositionFromFen } from "@/lib/round/round";
import { parseProgress, parseResult } from "@/lib/share/shareCode";
import { SHARE_NETWORKS } from "@/lib/shareIntents";
import en from "../../../../messages/en.json";

// eslint-disable-next-line @typescript-eslint/no-require-imports -- every catalogue by its locale, as the layout loads it
const catalogue = (locale: string): typeof en => require(`../../../../messages/${locale}.json`);

/** X counts every link as 23 characters and a CJK character as two; a post holds 280. */
const X_LINK = 23;
const X_LIMIT = 280;
function xLength(text: string): number {
  const linked = text.replace(/https?:\/\/\S+/g, "x".repeat(X_LINK));
  return [...linked].reduce((sum, char) => sum + (/[ᄀ-ᇿ⺀-鿿가-힯豈-﫿＀-￯]/u.test(char) ? 2 : 1), 0);
}

const FULL = labPositionFromFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
const LONGEST_RESULT: RoundShare = {
  kind: "daily",
  accuracy: 100,
  correct: 32,
  total: 32,
  pieceCount: 32,
  memorizeSeconds: 32,
  studySeconds: 31.9,
  rebuildSeconds: 3599.9,
  day: "2026-12-31",
  rating: { rating: 2999, change: -999 },
  winStreak: 9999,
};
const GAME_RESULT: RoundShare = {
  kind: "game",
  accuracy: 100,
  correct: 32,
  total: 32,
  pieceCount: 32,
  memorizeSeconds: 32,
  studySeconds: 31.9,
  rebuildSeconds: 3599.9,
  board: { target: FULL, placed: FULL },
  rating: { rating: 2999, change: 999 },
  winStreak: 9999,
};
const shown = (id: ShareCard["figures"][number]["id"], value: number, unit: ShareCard["figures"][number]["figure"]["unit"], digits: 0 | 1 = 0) => ({
  id,
  figure: { value, unit, digits },
  context: { kind: "recent" as const, values: {} },
});
const BUSIEST_CARD: ShareCard = {
  figures: [
    shown("span", 32, "pieces"),
    { ...shown("rating", 2999, "rating"), trend: { direction: "up", amount: 999 } },
    shown("piecesHeld", 31.9, "pieces", 1),
    shown("speed", 12.5, "secondsPerPiece", 1),
    shown("bestAccuracy", 100, "percent"),
    shown("recentAccuracy", 99, "percent"),
    shown("winStreak", 9999, "rounds"),
    shown("streak", 9999, "days"),
    shown("rounds", 999999, "rounds"),
    shown("days", 9999, "days"),
  ],
  rounds: 999999,
};

const codeOf = (url: string, kind: string) => decodeURIComponent(new URL(url).pathname.slice(`/share/${kind}/`.length));

describe("a shared card's post", () => {
  it.each(LOCALES)("links the card's own page and fits one X post at its widest in %s", (locale) => {
    const messages = catalogue(locale);
    const result = createTranslator({ locale, messages, namespace: "game.result.share" }) as unknown as ResultTranslate;
    const dashboard = createTranslator({ locale, messages, namespace: "dashboard" }) as unknown as DashboardTranslate;
    const posts = [
      { kind: "result", post: resultCaption(result, LONGEST_RESULT, locale), parse: parseResult },
      { kind: "result", post: resultCaption(result, GAME_RESULT, locale), parse: parseResult },
      { kind: "progress", post: shareCaption(dashboard, BUSIEST_CARD, locale), parse: parseProgress },
    ] as const;

    posts.forEach(({ kind, post, parse }) => {
      expect(post.url).toMatch(new RegExp(`^https://thememorychess\\.com/share/${kind}/[\\w-]+\\?utm_source=share&utm_medium=(dashboard|result)$`));
      expect(parse(codeOf(post.url, kind))).not.toBeNull();
      expect(xLength(`${post.text} ${post.url}`)).toBeLessThanOrEqual(X_LIMIT);
    });
  });

  it("hands every network the card's own link, so each post previews the card", () => {
    const post = resultCaption(createTranslator({ locale: "en", messages: en, namespace: "game.result.share" }) as unknown as ResultTranslate, GAME_RESULT, "en");
    const encoded = encodeURIComponent(post.url);

    SHARE_NETWORKS.forEach(({ intent }) => expect(intent(post)).toContain(encoded));
    expect(SHARE_NETWORKS.find(({ id }) => id === "x")?.intent(post)).toBe(`https://x.com/intent/post?text=${encodeURIComponent(post.text)}&url=${encoded}`);
  });
});
