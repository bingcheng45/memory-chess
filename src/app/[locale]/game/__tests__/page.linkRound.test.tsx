import "fake-indexeddb/auto";
import { deserialize, serialize } from "node:v8";
import { act, fireEvent, render, screen } from "@/test-utils/intl";
import { recordLabRound } from "@/lib/lab/recordRound";
import { labStore } from "@/lib/lab/storage";
import { useGameStore } from "@/lib/store/gameStore";
import GamePage from "@/app/[locale]/game/page";

// jsdom has no structuredClone, which fake-indexeddb copies records with.
globalThis.structuredClone ??= (value) => deserialize(serialize(value));

jest.mock("@/lib/utils/soundEffects", () => ({
  ...jest.requireActual("@/lib/utils/soundEffects"),
  playSound: jest.fn(),
  stopTimerSound: jest.fn(),
}));
jest.mock("@/i18n/navigation", () => ({
  usePathname: () => "/game",
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

const TARGET = "4k3/8/8/3q4/8/5N2/8/4K3";
const board = () => document.querySelector("[data-round-phase]");
const view = () => ({
  phase: board()?.getAttribute("data-round-phase"),
  pieces: board()?.querySelectorAll("img").length,
  count: document.querySelector(".round-count")?.textContent,
});
const advance = (ms: number) => act(() => jest.advanceTimersByTime(ms));

beforeEach(async () => {
  await labStore()?.clear();
  jest.useFakeTimers({ doNotFake: ["setImmediate", "nextTick", "queueMicrotask"] });
  jest.spyOn(console, "log").mockImplementation(() => {});
  window.history.pushState({}, "", "/game?pieceCount=3&memorizeTime=10&source=home_quick");
});

afterEach(() => {
  act(() => useGameStore.getState().resetGame());
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("GamePage round a link starts", () => {
  it.each([
    ["a player's first-ever round", async () => {}],
    [
      "a later round",
      () =>
        recordLabRound({ id: "first", source: "game", pieceCount: 3, memorizeSeconds: 10, targetFen: TARGET, placedFen: TARGET, memorizeMs: 10_000, solveMs: 9_000 }),
    ],
  ])("holds %s behind the rule and Start, then counts in before study", async (_, arrange) => {
    await arrange();

    render(<GamePage />);
    const start = await screen.findByRole("button", { name: "Start" });
    const waiting = { rule: screen.getByText("Study 3 pieces for 10 s, then rebuild the position from memory.").tagName, ...view() };
    await advance(15_000);
    const afterWaiting = view();

    fireEvent.click(start);
    const counting = view();
    await advance(3_000);

    expect(waiting).toEqual({ rule: "P", phase: "ready", pieces: 0, count: undefined });
    expect(afterWaiting).toEqual({ phase: "ready", pieces: 0, count: undefined });
    expect(counting).toEqual({ phase: "countdown", pieces: 0, count: "3" });
    expect(view()).toEqual({ phase: "study", pieces: 3, count: undefined });
    expect(screen.getByRole("button", { name: "Hide board" })).toBeEnabled();
  });

  it("holds a blindfold link round behind Start too, then studies it as notation with no pieces on the board", async () => {
    window.history.pushState({}, "", "/game?pieceCount=3&memorizeTime=10&source=guide_cta&mode=blindfold");

    render(<GamePage />);
    fireEvent.click(await screen.findByRole("button", { name: "Start" }));
    const counting = view();
    await advance(3_000);

    expect(counting).toEqual({ phase: "countdown", pieces: 0, count: "3" });
    expect(view()).toEqual({ phase: "study", pieces: 0, count: undefined });
    expect(document.querySelector("[data-study-notation]")).not.toBeNull();
    expect(useGameStore.getState().round).toMatchObject({ phase: "study", config: { blindfold: true, pieceCount: 3 } });
  });

  it("opens the configuration form when the player leaves the link's round", async () => {
    render(<GamePage />);
    await screen.findByRole("button", { name: "Start" });

    fireEvent.click(screen.getByRole("button", { name: "Leave the round" }));

    expect(useGameStore.getState().round.phase).toBe("idle");
    expect(screen.getByRole("button", { name: "Start round" })).toBeEnabled();
  });
});
