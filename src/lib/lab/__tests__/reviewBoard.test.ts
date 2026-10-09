import { computeCurve } from "@/lib/lab/curve";
import { daysBetween } from "@/lib/lab/readiness";
import type { RoundRecord } from "@/lib/lab/record";
import { readReviewOpened, REVIEW_OPENED_KEY } from "@/lib/lab/review";
import { markReviewOpened, reviewStart } from "@/lib/lab/reviewBoard";
import { summarize } from "@/lib/lab/summary";
import { reviewedBoard, seenBoard } from "./fixtures";

const BOARD = "4k3/8/8/3q4/8/5N2/8/4K3";
const missed = seenBoard("first-round", "2026-10-01", BOARD, "4k3/8/8/8/8/8/8/4K3");
/** Local noon, so the local day is the one named whatever the time zone. */
const noonOn = (day: number) => new Date(2026, 9, day, 12).getTime();

afterEach(() => window.localStorage.clear());

describe("starting a review", () => {
  it("replays the longest waiting due board at its own setting, as a full position the game can load", () => {
    expect(reviewStart([missed], noonOn(2), [])).toEqual({
      kind: "play",
      pieceCount: 4,
      memorizeTime: 10,
      board: { kind: "review", fen: `${BOARD} w - - 0 1`, reviewOf: "first-round", firstDay: "2026-10-01", step: 0 },
    });
  });

  it("gives the move to black when black stands in check, as the game's own generator does", () => {
    const checked = seenBoard("checked", "2026-10-01", "4k3/8/8/8/8/8/8/4RK2", "8/8/8/8/8/8/8/8", 3);

    expect(reviewStart([checked], noonOn(2), [])).toMatchObject({ board: { fen: "4k3/8/8/8/8/8/8/4RK2 b - - 0 1" } });
  });

  it("passes over a due board the game cannot load, such as one without a king from an imported file", () => {
    const kingless = seenBoard("a-kingless", "2026-10-01", "8/8/8/3q4/8/5N2/8/8", "8/8/8/8/8/8/8/8");

    expect(reviewStart([kingless, missed], noonOn(2), [])).toMatchObject({ kind: "play", board: { reviewOf: "first-round" } });
    expect(reviewStart([kingless], noonOn(2), [])).toEqual({ kind: "none" });
  });

  it("starts nothing once five boards were reviewed or opened today, and the next board the day after", () => {
    const ranks = ["Q6p", "1Q5p", "2Q4p", "3Q3p", "4Q2p", "5Q1p"];
    const boards = ranks.map((rank, index) => seenBoard(`c${index}`, "2026-10-01", `4k3/8/8/8/${rank}/8/8/4K3`, "4k3/8/8/8/8/8/8/4K3"));
    const reviewed = boards.slice(0, 2).map((board, index) => reviewedBoard(`cr${index}`, "2026-10-02", board, 1));
    const opened = ["c2", "c3", "c4"].map((reviewOf) => ({ reviewOf, step: 0, day: "2026-10-02" }));

    expect(reviewStart([...boards, ...reviewed], noonOn(2), opened.slice(0, 2))).toMatchObject({ kind: "play", board: { reviewOf: "c4" } });
    expect(reviewStart([...boards, ...reviewed], noonOn(2), opened)).toEqual({ kind: "capped" });
    expect(reviewStart([...boards, ...reviewed], noonOn(3), opened)).toMatchObject({ kind: "play", board: { reviewOf: "c5" } });
  });

  it("starts nothing when no board is due today", () => {
    expect(reviewStart([missed, reviewedBoard("r1", "2026-10-02", missed, 1)], noonOn(2), [])).toEqual({ kind: "none" });
    expect(reviewStart([missed], noonOn(2), [{ reviewOf: "first-round", step: 0, day: "2026-10-02" }])).toEqual({ kind: "none" });
  });
});

describe("the review steps opened on this device", () => {
  it("are kept by board, the last step passed and the day opened, newest last, without repeats", () => {
    const board = { kind: "review", fen: BOARD, reviewOf: "first-round", firstDay: "2026-10-01", step: 0 } as const;

    markReviewOpened(board, noonOn(2));
    markReviewOpened({ ...board, step: 1 }, noonOn(4));
    markReviewOpened({ ...board, step: 1 }, noonOn(4));

    expect(window.localStorage.getItem(REVIEW_OPENED_KEY)).toBe(
      '[{"reviewOf":"first-round","step":0,"day":"2026-10-02"},{"reviewOf":"first-round","step":1,"day":"2026-10-04"}]',
    );
    expect(readReviewOpened()).toEqual([
      { reviewOf: "first-round", step: 0, day: "2026-10-02" },
      { reviewOf: "first-round", step: 1, day: "2026-10-04" },
    ]);
  });

  it("read a marker kept before days were, as its step with no day", () => {
    window.localStorage.setItem(REVIEW_OPENED_KEY, '["first-round:0","with:colon:1"]');

    expect(readReviewOpened()).toEqual([
      { reviewOf: "first-round", step: 0, day: null },
      { reviewOf: "with:colon", step: 1, day: null },
    ]);
    expect(reviewStart([missed], noonOn(2), readReviewOpened())).toEqual({ kind: "none" });
  });

  it("drop a marker older than the 28-day window at the next write, since its board has left the queue; one without a day stays", () => {
    window.localStorage.setItem(
      REVIEW_OPENED_KEY,
      JSON.stringify(["legacy:0", { reviewOf: "old", step: 0, day: "2026-09-03" }, { reviewOf: "kept", step: 0, day: "2026-09-04" }]),
    );

    markReviewOpened({ kind: "review", fen: BOARD, reviewOf: "first-round", firstDay: "2026-10-01", step: 0 }, noonOn(2));

    expect(readReviewOpened()).toEqual([
      { reviewOf: "legacy", step: 0, day: null },
      { reviewOf: "kept", step: 0, day: "2026-09-04" },
      { reviewOf: "first-round", step: 0, day: "2026-10-02" },
    ]);
  });

  it("read as none when the stored value is not a list of keys", () => {
    window.localStorage.setItem(REVIEW_OPENED_KEY, '{"first-round":0}');

    expect(readReviewOpened()).toEqual([]);
  });
});

describe("a review opened late and left without a result", () => {
  const BOARDS = ["4k3/8/8/8/Q6p/8/8/4K3", "4k3/8/8/8/1R4p1/8/8/4K3", "4k3/8/8/8/2B2p2/8/8/4K3"];
  const firsts = BOARDS.map((fen, index) => seenBoard(`late${index}`, "2026-10-01", fen, "4k3/8/8/8/8/8/8/4K3"));
  const dayOf = (day: number) => `2026-10-0${day}`;

  /** Opens each board due on `day` once, as /game does, and leaves it before the result. */
  function leaveEach(day: number) {
    firsts.forEach(() => {
      const start = reviewStart(firsts, noonOn(day), readReviewOpened());
      if (start.kind === "play") markReviewOpened(start.board, noonOn(day));
    });
  }

  /** Opens and plays in full every board due on `day`, saving each review as the game files it. */
  function playDue(records: readonly RoundRecord[], day: number): RoundRecord[] {
    const played = [...records];
    for (let start = reviewStart(played, noonOn(day), readReviewOpened()); start.kind === "play"; start = reviewStart(played, noonOn(day), readReviewOpened())) {
      const { board } = start;
      markReviewOpened(board, noonOn(day));
      const first = firsts.find(({ id }) => id === board.reviewOf) as RoundRecord;
      played.push(reviewedBoard(`${board.reviewOf}-${day}`, dayOf(day), first, daysBetween(board.firstDay, dayOf(day))));
    }
    return played;
  }

  it("counts as a review at the delay it was opened, so the step it passed does not come back that day", () => {
    leaveEach(6);

    expect(readReviewOpened()).toEqual(firsts.map(({ id }) => ({ reviewOf: id, step: 1, day: "2026-10-06" })));
    expect(reviewStart(firsts, noonOn(6), readReviewOpened())).toEqual({ kind: "none" });
    expect(reviewStart(firsts, noonOn(8), readReviewOpened())).toMatchObject({ kind: "play", board: { step: 2 } });
  });

  it("files the review played next under the 7 day gap, not a second look at 3 days", () => {
    leaveEach(6);
    const records = playDue(playDue(firsts, 6), 8);

    expect(computeCurve({ records, summary: summarize(records), today: "2026-10-08" }).value?.points).toEqual([
      { day: 0, accuracy: 50, count: 3 },
      { day: 7, accuracy: 100, count: 3 },
    ]);
  });
});
