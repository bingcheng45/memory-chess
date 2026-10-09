import { readReviewOpened, REVIEW_OPENED_KEY } from "@/lib/lab/review";
import { markReviewOpened, reviewStart } from "@/lib/lab/reviewBoard";
import { reviewedBoard, seenBoard } from "./fixtures";

const BOARD = "4k3/8/8/3q4/8/5N2/8/4K3";
const missed = seenBoard("first-round", "2026-10-01", BOARD, "4k3/8/8/8/8/8/8/4K3");
/** Local noon, so the local day is the one named whatever the time zone. */
const noonOn = (day: number) => new Date(2026, 9, day, 12).getTime();

afterEach(() => window.localStorage.clear());

describe("starting a review", () => {
  it("replays the longest waiting due board at its own setting, as a full position the game can load", () => {
    expect(reviewStart([missed], noonOn(2), new Set())).toEqual({
      kind: "play",
      pieceCount: 4,
      memorizeTime: 10,
      board: { kind: "review", fen: `${BOARD} w - - 0 1`, reviewOf: "first-round", firstDay: "2026-10-01", step: 0 },
    });
  });

  it("gives the move to black when black stands in check, as the game's own generator does", () => {
    const checked = seenBoard("checked", "2026-10-01", "4k3/8/8/8/8/8/8/4RK2", "8/8/8/8/8/8/8/8", 3);

    expect(reviewStart([checked], noonOn(2), new Set())).toMatchObject({ board: { fen: "4k3/8/8/8/8/8/8/4RK2 b - - 0 1" } });
  });

  it("starts nothing when no board is due today", () => {
    expect(reviewStart([missed, reviewedBoard("r1", "2026-10-02", missed, 1)], noonOn(2), new Set())).toEqual({ kind: "none" });
    expect(reviewStart([missed], noonOn(2), new Set(["first-round:0"]))).toEqual({ kind: "none" });
  });
});

describe("the review steps opened on this device", () => {
  it("are kept by board and step, newest last, without repeats", () => {
    const board = { kind: "review", fen: BOARD, reviewOf: "first-round", firstDay: "2026-10-01", step: 0 } as const;

    markReviewOpened(board);
    markReviewOpened({ ...board, step: 1 });
    markReviewOpened({ ...board, step: 1 });

    expect(window.localStorage.getItem(REVIEW_OPENED_KEY)).toBe('["first-round:0","first-round:1"]');
    expect([...readReviewOpened()]).toEqual(["first-round:0", "first-round:1"]);
  });

  it("keep only the newest 50, far more than one player's queue holds at once", () => {
    const board = { kind: "review", fen: BOARD, firstDay: "2026-10-01", step: 0 } as const;

    Array.from({ length: 52 }, (_, index) => markReviewOpened({ ...board, reviewOf: `round-${index}` }));

    expect([...readReviewOpened()].slice(0, 2)).toEqual(["round-2:0", "round-3:0"]);
    expect(readReviewOpened().size).toBe(50);
  });

  it("read as none when the stored value is not a list of keys", () => {
    window.localStorage.setItem(REVIEW_OPENED_KEY, '{"first-round":0}');

    expect(readReviewOpened().size).toBe(0);
  });
});
