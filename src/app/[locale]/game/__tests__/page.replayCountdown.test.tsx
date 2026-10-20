import { act, fireEvent, render, screen } from "@/test-utils/intl";
import { recordLabRound } from "@/lib/lab/recordRound";
import { useGameStore } from "@/lib/store/gameStore";
import { stopTimerSound } from "@/lib/utils/soundEffects";
import GamePage from "@/app/[locale]/game/page";

jest.mock("@/lib/lab/recordRound", () => ({ recordLabRound: jest.fn() }));
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

const board = () => document.querySelector("[data-round-phase]");
const stage = () => document.querySelector(".round-stage-board");
const pieces = () => board()?.querySelectorAll("img").length;
const count = () => document.querySelector(".round-count")?.textContent;
const advance = (ms: number) => act(() => jest.advanceTimersByTime(ms));
const view = () => ({
  phase: board()?.getAttribute("data-round-phase"),
  pieces: pieces(),
  count: count(),
  hidden: stage()?.getAttribute("aria-hidden") ?? null,
  startButton: screen.queryByRole("button", { name: "Start game" }) !== null,
});

let gtag: jest.Mock;
const roundStarts = () => gtag.mock.calls.filter(([, name]) => name === "round_start").map(([, , params]) => params.round_source);

beforeEach(() => {
  jest.useFakeTimers({ now: Date.parse("2026-10-14T12:00:00Z") });
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.mocked(recordLabRound).mockResolvedValue(true);
  jest.mocked(stopTimerSound).mockClear();
  localStorage.clear();
  gtag = jest.fn();
  window.gtag = gtag;
  window.history.pushState({}, "", "/game?pieceCount=3&memorizeTime=5&source=link");
});

afterEach(() => {
  act(() => useGameStore.getState().resetGame());
  jest.useRealTimers();
  jest.restoreAllMocks();
  Reflect.deleteProperty(window, "gtag");
});

async function playToRebuild() {
  render(<GamePage />);
  await act(async () => {});
  fireEvent.click(screen.getByText("Start", { selector: "button" }));
  act(() => useGameStore.getState().endCountdown());
  fireEvent.click(screen.getByText("Hide board", { selector: "button" }));
}

async function countThrough() {
  const counted = [view()];
  await advance(1000);
  counted.push(view());
  await advance(1000);
  counted.push(view());
  await advance(1000);
  return counted;
}

const COUNTING = { phase: "countdown", pieces: 0, hidden: "true", startButton: false } as const;

describe("GamePage replay count-in", () => {
  it("counts 3, 2, 1 over the veiled empty board after Try again, then studies a new board with round_start sent once", async () => {
    await playToRebuild();
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await act(async () => {});
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    const startsBefore = roundStarts();

    const counted = await countThrough();

    expect(startsBefore).toEqual(["link"]);
    expect(counted).toEqual([
      { ...COUNTING, count: "3" },
      { ...COUNTING, count: "2" },
      { ...COUNTING, count: "1" },
    ]);
    expect(view()).toEqual({ phase: "study", pieces: 3, count: undefined, hidden: null, startButton: false });
    expect(screen.queryByText(/Daily board/)).toBeNull();
    expect(roundStarts()).toEqual(["link", "try_again"]);
    expect(useGameStore.getState().gameState.board).toBeUndefined();
  });

  it("counts a new board in after Restart mid-round, stopping the timer sound", async () => {
    await playToRebuild();
    const stopsBefore = jest.mocked(stopTimerSound).mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Restart" }));
    const stopped = jest.mocked(stopTimerSound).mock.calls.length > stopsBefore;

    const counted = await countThrough();

    expect(stopped).toBe(true);
    expect(counted.map(({ count: shown }) => shown)).toEqual(["3", "2", "1"]);
    expect(counted.every(({ phase, pieces: shown, hidden }) => phase === "countdown" && shown === 0 && hidden === "true")).toBe(true);
    expect([view().phase, view().pieces, roundStarts()]).toEqual(["study", 3, ["link", "try_again"]]);
  });

  it("counts 3, 2, 1 over the veiled empty board after the form's Start round, then studies that setting", async () => {
    window.history.pushState({}, "", "/game");
    render(<GamePage />);
    await act(async () => {});
    fireEvent.click(screen.getByRole("button", { name: /Hard/ }));
    fireEvent.click(screen.getByRole("button", { name: "Start round" }));
    const startsBefore = roundStarts();

    const counted = await countThrough();

    expect(startsBefore).toEqual([]);
    expect(counted.map(({ count: shown }) => shown)).toEqual(["3", "2", "1"]);
    expect(counted.every(({ phase, pieces: shown, hidden }) => phase === "countdown" && shown === 0 && hidden === "true")).toBe(true);
    expect([view().phase, view().pieces, roundStarts()]).toEqual(["study", 12, ["game_form"]]);
    expect(useGameStore.getState().gameState.board).toBeUndefined();
  });
});
