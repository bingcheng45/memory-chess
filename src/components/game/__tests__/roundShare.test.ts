import { createTranslator } from "next-intl";
import { captionWithLink } from "@/components/share/shareLink";
import { rebuildOrder, resultCaption, resultCardCopy, roundShareOf, type ResultTranslate } from "@/components/game/roundShare";
import { MAX_PLACEMENTS } from "@/lib/lab/placements";
import { labPositionFromFen, roundReducer, IDLE_ROUND, type RoundAction, type RoundState } from "@/lib/round/round";
import type { SetBoard } from "@/lib/types/game";
import en from "../../../../messages/en.json";
import de from "../../../../messages/de.json";

const translator = (locale: string, messages: typeof en) => createTranslator({ locale, messages, namespace: "game.result.share" }) as unknown as ResultTranslate;
const EN = translator("en", en);
const NBSP = String.fromCharCode(160);

const WHITE_KING = { color: "white", type: "king" } as const;
const BLACK_QUEEN = { color: "black", type: "queen" } as const;
const WHITE_ROOK = { color: "white", type: "rook" } as const;

/** Plays a round through the reducer the board drives: study 8.4 s, a king right, a rook on an empty square, the queen and a pawn missed, 38.25 s to rebuild. */
function scored(board?: SetBoard): Extract<RoundState, { phase: "scored" }> {
  const target = labPositionFromFen("4k3/8/8/3q4/8/8/4P3/4K3");
  const actions = [
    { type: "start", config: { pieceCount: 4, studyMs: 10_000, source: board ? board.kind : "game_form", board }, target, now: 0 },
    { type: "studyEnded", now: 8_400 },
    { type: "place", piece: { color: "black", type: "king" }, square: "e8", now: 9_000 },
    { type: "place", piece: WHITE_KING, square: "e1", now: 10_000 },
    { type: "place", piece: WHITE_ROOK, square: "a1", now: 11_000 },
    { type: "submit", now: 8_400 + 38_250 },
  ] as const;
  const state = actions.reduce<RoundState>((round, action) => roundReducer(round, action), IDLE_ROUND);
  if (state.phase !== "scored") throw new Error("round did not score");
  return state;
}

const STANDING = { rating: 1214, change: 14, winStreak: 3 };
const DAILY: SetBoard = { kind: "daily", day: "2026-10-12", fen: "4k3/8/8/3q4/8/8/4P3/4K3" };
const REVIEW: SetBoard = { kind: "review", fen: "4k3/8/8/3q4/8/8/4P3/4K3", reviewOf: "r1", firstDay: "2026-10-05", step: 1 };

describe("roundShareOf", () => {
  it("reads a random round's score, setting, times, rating and win streak, with its scored board", () => {
    const share = roundShareOf(scored(), STANDING);

    expect({ ...share, board: undefined }).toEqual({
      kind: "game",
      accuracy: 50,
      correct: 2,
      total: 4,
      pieceCount: 4,
      memorizeSeconds: 10,
      studySeconds: 8.4,
      rebuildSeconds: 38.3,
      rating: { rating: 1214, change: 14 },
      winStreak: 3,
      board: undefined,
    });
    expect(share.kind === "game" && [share.board.target.d5, share.board.placed.a1]).toEqual([BLACK_QUEEN, WHITE_ROOK]);
  });

  it("drops a win streak under two", () => {
    expect(roundShareOf(scored(), { ...STANDING, winStreak: 1 })).toMatchObject({ kind: "game", winStreak: null });
  });

  it("carries no position for the daily board, which every player gets that day", () => {
    const share = roundShareOf(scored(DAILY), STANDING);

    expect(share).toMatchObject({ kind: "daily", day: "2026-10-12", rating: { rating: 1214, change: 14 } });
    expect("board" in share).toBe(false);
  });

  it("carries no rating or streak for a review, which leaves both unchanged", () => {
    const share = roundShareOf(scored(REVIEW), STANDING);

    expect(share.kind).toBe("review");
    expect(["rating" in share, "winStreak" in share, "board" in share]).toEqual([false, false, true]);
  });
});

describe("rebuildOrder", () => {
  const rebuild = (moves: readonly RoundAction[]) => {
    const start: readonly RoundAction[] = [
      { type: "start", config: { pieceCount: 4, studyMs: 10_000, source: "game_form" }, target: labPositionFromFen("4k3/8/8/3q4/8/8/4P3/4K3"), now: 0 },
      { type: "studyEnded", now: 8_000 },
    ];
    const state = [...start, ...moves, { type: "submit", now: 60_000 } as const].reduce<RoundState>(roundReducer, IDLE_ROUND);
    if (state.phase !== "scored") throw new Error("round did not score");
    return rebuildOrder(state.placed, state.log);
  };

  it("orders a round's pieces as they went down, in seconds since the rebuild started", () => {
    expect(roundShareOf(scored(), STANDING)).toMatchObject({
      board: {
        order: [
          { square: "e8", seconds: 0.6 },
          { square: "e1", seconds: 1.6 },
          { square: "a1", seconds: 2.6 },
        ],
      },
    });
  });

  it("times a moved piece from its last move and leaves out a piece lifted off the board", () => {
    const order = rebuild([
      { type: "place", piece: WHITE_KING, square: "e2", now: 9_000 },
      { type: "place", piece: WHITE_ROOK, square: "a1", now: 9_500 },
      { type: "place", piece: { color: "black", type: "king" }, square: "e8", now: 10_000 },
      { type: "move", from: "e2", to: "e1", now: 12_040 },
      { type: "remove", square: "a1" },
    ]);

    expect(order).toEqual([
      { square: "e8", seconds: 2 },
      { square: "e1", seconds: 4 },
    ]);
  });

  it("knows no order once the log stopped short of the board", () => {
    const shuffles = Array.from({ length: MAX_PLACEMENTS - 1 }, (_, index): RoundAction => ({
      type: "move",
      from: index % 2 === 0 ? "a1" : "a2",
      to: index % 2 === 0 ? "a2" : "a1",
      now: 9_000 + index,
    }));
    const order = rebuild([
      { type: "place", piece: WHITE_ROOK, square: "a1", now: 9_000 },
      ...shuffles,
      { type: "move", from: "a2", to: "a3", now: 20_000 },
    ]);

    expect(order).toBeNull();
  });
});

describe("resultCardCopy", () => {
  it("prints the accuracy large, the pieces, the setting, times, rating and streak, and a legend for the board", () => {
    expect(resultCardCopy(EN, roundShareOf(scored(), STANDING), "en")).toEqual({
      kicker: "Round result",
      accuracyLabel: "Accuracy",
      accuracy: "50%",
      pieces: "2 of 4 pieces",
      stats: [
        { label: "Setting", value: "4 pieces, 10 s study" },
        { label: "Study time", value: "8.4 s" },
        { label: "Rebuild time", value: "38.3 s" },
        { label: "Rating", value: "1,214 (+14)", mark: { figure: "1,214", trend: { direction: "up", text: "14" } } },
        { label: "Win streak", value: "3 rounds in a row" },
      ],
      legend: { correct: "Correct", missed: "Missed", wrong: "Wrong" },
      cta: "Can you beat it?",
      site: "thememorychess.com",
      alt: "Memory Chess result card: Round result, Accuracy 50%, 2 of 4 pieces, Setting 4 pieces, 10 s study, Study time 8.4 s, Rebuild time 38.3 s, Rating 1,214 (+14), Win streak 3 rounds in a row.",
    });
  });

  it("badges the daily board with its date and prints no legend, since it draws no board", () => {
    const copy = resultCardCopy(EN, roundShareOf(scored(DAILY), { ...STANDING, change: -6, winStreak: 0 }), "en");

    expect([copy.kicker, copy.legend, copy.stats.map(({ value }) => value)]).toEqual(["Daily board · Oct 12, 2026", null, ["4 pieces, 10 s study", "8.4 s", "38.3 s", "1,214 (-6)"]]);
  });

  it("hands the card the rating and its change apart, so the change is drawn as an arrow in green or red, and none when it is level", () => {
    const rating = (change: number) =>
      resultCardCopy(EN, roundShareOf(scored(DAILY), { ...STANDING, change, winStreak: 0 }), "en").stats.find(({ label }) => label === "Rating");

    expect(rating(-6)?.mark).toEqual({ figure: "1,214", trend: { direction: "down", text: "6" } });
    expect(rating(0)).toEqual({ label: "Rating", value: "1,214 (0)" });
  });

  it("names a review round and leaves out the rating it did not change", () => {
    const copy = resultCardCopy(EN, roundShareOf(scored(REVIEW), STANDING), "en");

    expect([copy.kicker, copy.stats.map(({ label }) => label)]).toEqual(["Review round", ["Setting", "Study time", "Rebuild time"]]);
  });

  it("writes the player's language and number format", () => {
    const copy = resultCardCopy(translator("de", de as typeof en), roundShareOf(scored(), STANDING), "de");

    expect([copy.accuracy, copy.stats[0].value, copy.stats[1].value, copy.stats[3].value]).toEqual([`50${NBSP}%`, "4 Figuren, 10 s Einprägezeit", "8,4 s", "1.214 (+14)"]);
  });
});

describe("resultCaption", () => {
  it("says the score in one sentence and links the card's own page tagged as a shared result", () => {
    expect(captionWithLink(resultCaption(EN, roundShareOf(scored(), STANDING), "en"))).toBe(
      "I recalled 2 of 4 pieces (50%) on Memory Chess. Can you beat it? https://thememorychess.com/share/result/1_g_4_100_84_383_1214_u14_3_4k3-8-8-3q4-8-8-4P3-4K3_4k3-8-8-8-8-8-8-R3K3_e86e110a110?utm_source=share&utm_medium=result",
    );
  });

  it("names the daily board and its day, or a review board", () => {
    expect(resultCaption(EN, roundShareOf(scored(DAILY), STANDING), "en").text).toBe(
      "I recalled 2 of 4 pieces (50%) on the Memory Chess daily board for Oct 12, 2026. Can you beat it?",
    );
    expect(resultCaption(EN, roundShareOf(scored(REVIEW), STANDING), "en").text).toBe("I recalled 2 of 4 pieces (50%) on a Memory Chess review board. Can you beat it?");
  });
});
