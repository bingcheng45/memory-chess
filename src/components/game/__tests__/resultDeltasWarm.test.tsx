import "fake-indexeddb/auto";
import { deserialize, serialize } from "node:v8";
import { render, screen, waitFor } from "@/test-utils/intl";
import GameResult from "@/components/game/GameResult";
import { warmedResultDeltas, warmResultDeltas } from "@/components/game/resultDeltasWarm";
import { recordLabRound } from "@/lib/lab/recordRound";
import { useGameStore } from "@/lib/store/gameStore";

// jsdom has no structuredClone, which fake-indexeddb copies records with.
globalThis.structuredClone ??= (value) => deserialize(serialize(value));

jest.mock("@/lib/leaderboard/cutoffsClient", () => ({ loadLeaderboardCutoffs: jest.fn(async () => null), readCachedCutoffs: () => null }));
jest.mock("@/lib/utils/soundEffects", () => ({ playSound: jest.fn(), isSoundEnabled: () => false }));
jest.mock("@/components/game/FirstGameFeedbackDialog", () => ({ __esModule: true, default: () => null }));

const TARGET = "4k3/8/8/3q4/8/5N2/8/4K3";
const store = () => useGameStore.getState();
const figures = () => screen.queryByRole("region", { name: "Your dashboard after this round" });
const savedToast = () => screen.queryByText("Round saved. Your updated stats are just below.");
const said = (section: HTMLElement) => [...section.querySelectorAll(".lab-sr")].map((line) => line.textContent);

function playRound() {
  store().startGame(4, 10, "game_form");
  store().dispatch({ type: "studyEnded", now: 0 });
  store().submitSolution(4000);
}

beforeAll(async () => {
  await recordLabRound({ id: "earlier", source: "game", pieceCount: 4, memorizeSeconds: 10, targetFen: TARGET, placedFen: TARGET, memorizeMs: 10000, solveMs: 9000 });
});

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { value: 1 } }) });
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  store().resetGame();
  jest.restoreAllMocks();
});

describe("the dashboard figures on the result screen", () => {
  it("are whole in the screen's first render when the round warmed them, counting the round before it is saved, and announced below the fold", async () => {
    warmResultDeltas();
    await waitFor(() => expect(warmedResultDeltas()?.before.records.map(({ id }) => id)).toEqual(["earlier"]));
    playRound();
    jest.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ top: 1200, bottom: 1500 } as DOMRect);

    render(<GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} onPlay={jest.fn()} />);

    const section = figures();
    expect(section).not.toBeNull();
    expect(said(section as HTMLElement)).toContain("Rounds played 2 rounds, up 1 from 1 round, better");
    expect(savedToast()).not.toBeNull();
  });

  it("stay off a screen whose round ended before they were warmed, do not arrive late, and announce nothing", async () => {
    warmResultDeltas();
    playRound();

    render(<GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} onPlay={jest.fn()} />);
    await waitFor(() => expect(warmedResultDeltas()).not.toBeNull());

    expect(figures()).toBeNull();
    expect(savedToast()).toBeNull();
  });
});
