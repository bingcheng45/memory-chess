import { act, render } from "@/test-utils/intl";
import GameResult from "@/components/game/GameResult";
import { scoredRound } from "@/test-utils/round";
import { EMPTY_SUMMARY } from "@/lib/lab/summary";

const labRoundOf = (id: string) => ({
  endedAt: Date.parse("2026-10-18T12:00:00"),
  facts: { id, source: "game", pieceCount: 6, memorizeSeconds: 10, targetFen: "8/8/8/8/8/8/8/P7", placedFen: "8/8/8/8/8/8/8/P7", memorizeMs: 8250, solveMs: 12500 },
});

let mockLabRound = labRoundOf("unset");
jest.mock("@/lib/store/gameStore", () => ({
  useGameStore: () => ({
    gameState: {
      pieceCount: 6,
      memorizeTime: 10,
      actualMemorizeTime: 8.25,
      completionTime: 12.5,
      accuracy: 80,
      correctPlacements: 4,
      extraPieces: 0,
      totalPiecesPlaced: 5,
      originalPosition: "8/8/8/8/8/8/8/P7 w - - 0 1",
      userPosition: "8/8/8/8/8/8/8/P7 w - - 0 1",
      labRound: mockLabRound,
    },
    round: scoredRound("4k3/8/8/8/3q4/8/PP6/4K3", "4k3/8/8/8/8/8/PP6/4K3"),
    history: [],
  }),
}));
jest.mock("@/lib/leaderboard/cutoffsClient", () => ({
  loadLeaderboardCutoffs: jest.fn().mockResolvedValue(null),
  readCachedCutoffs: jest.fn().mockReturnValue(null),
}));
jest.mock("@/lib/utils/soundEffects", () => ({ playSound: jest.fn() }));

type Summary = { rounds: number; days: string[] };
let mockRecordRead: Promise<{ records: never[]; summary: Summary } | null> = Promise.resolve(null);
jest.mock("@/components/game/resultDeltasWarm", () => ({
  warmedResultDeltas: () => null,
  recordReadDuringRound: () => mockRecordRead,
}));

let mockAsked = false;
jest.mock("@/components/game/FirstGameFeedbackDialog", () => ({
  __esModule: true,
  default: () => {
    mockAsked = true;
    return null;
  },
}));

const recordOf = (rounds: number, firstDay?: string, ids: string[] = []) => ({
  records: ids.map((id) => ({ id })) as never[],
  summary: { ...EMPTY_SUMMARY, rounds, days: firstDay ? [firstDay] : [] },
});

async function asks(id: string, record: Promise<ReturnType<typeof recordOf> | null>, settle?: () => void): Promise<boolean> {
  mockLabRound = labRoundOf(id);
  mockRecordRead = record;
  mockAsked = false;
  const { unmount } = render(<GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} onPlay={jest.fn()} />);
  await act(async () => {});
  if (settle) {
    if (mockAsked) throw new Error("asked before the record arrived");
    settle();
    await act(async () => {});
  }
  unmount();
  return mockAsked;
}

beforeEach(() => {
  window.localStorage.clear();
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { value: 1 } }) });
});

describe("GameResult feedback when the record is not warm at the result", () => {
  it("without a record, stays quiet on the session's first result and asks on the next, then not for a day", async () => {
    const first = await asks("first", Promise.resolve(null));
    const firstAgain = await asks("first", Promise.resolve(null));
    const second = await asks("second", Promise.resolve(null));
    window.localStorage.setItem("memory-chess-feedback-next-eligible-at", String(Date.now() + 60_000));
    const third = await asks("third", Promise.resolve(null));

    expect([first, firstAgain, second, third]).toEqual([false, false, true, false]);
  });

  it("decides when a late record arrives: asks on the fifth round, never on a first result", async () => {
    const late = (record: ReturnType<typeof recordOf>) => {
      let resolve: (value: ReturnType<typeof recordOf>) => void = () => {};
      const read = new Promise<ReturnType<typeof recordOf>>((settle) => (resolve = settle));
      return [read, () => resolve(record)] as const;
    };

    const fifth = await asks("fifth", ...late(recordOf(4, "2026-10-18")));
    const firstEver = await asks("first-ever", ...late(recordOf(0)));

    expect([fifth, firstEver]).toEqual([true, false]);
  });

  it("does not count the round just played when a late record already holds it", async () => {
    const fourth = await asks("fourth", Promise.resolve(recordOf(4, "2026-10-18", ["a", "b", "c", "fourth"])));
    const fifth = await asks("fifth", Promise.resolve(recordOf(5, "2026-10-18", ["a", "b", "c", "d", "fifth"])));
    const firstEver = await asks("only", Promise.resolve(recordOf(1, "2026-10-18", ["only"])));

    expect([fourth, fifth, firstEver]).toEqual([false, true, false]);
  });
});
