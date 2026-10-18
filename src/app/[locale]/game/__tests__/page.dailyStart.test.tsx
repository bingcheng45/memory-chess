import { act, fireEvent, render, screen } from "@/test-utils/intl";
import { openDaily } from "@/lib/lab/dailyBoard";
import { recordLabRound } from "@/lib/lab/recordRound";
import { useGameStore } from "@/lib/store/gameStore";
import GamePage from "@/app/[locale]/game/page";

const mockReplace = jest.fn();
const OPENED_KEY = "memory-chess-lab-daily-opened";
const BOARD = { kind: "daily", day: "2026-10-14", fen: "8/8/8/1pQ4k/P2p4/8/8/1K6 b - - 0 1" } as const;

jest.mock("@/lib/lab/dailyBoard", () => ({ ...jest.requireActual("@/lib/lab/dailyBoard"), openDaily: jest.fn() }));
jest.mock("@/lib/lab/recordRound", () => ({ recordLabRound: jest.fn() }));
jest.mock("@/lib/utils/soundEffects", () => ({
  ...jest.requireActual("@/lib/utils/soundEffects"),
  playSound: jest.fn(),
  stopTimerSound: jest.fn(),
}));
jest.mock("@/i18n/navigation", () => ({
  usePathname: () => "/game",
  useRouter: () => ({ push: jest.fn(), replace: mockReplace }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

const board = () => document.querySelector("[data-round-phase]");
const pieces = () => board()?.querySelectorAll("img").length;
const count = () => document.querySelector(".round-count")?.textContent;
const advance = (ms: number) => act(() => jest.advanceTimersByTime(ms));

let gtag: jest.Mock;

beforeEach(() => {
  jest.useFakeTimers({ now: Date.parse("2026-10-14T12:00:00Z") });
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.mocked(openDaily).mockResolvedValue({ kind: "play", pieceCount: 6, memorizeTime: 10, board: BOARD });
  mockReplace.mockClear();
  localStorage.clear();
  gtag = jest.fn();
  window.gtag = gtag;
  window.history.pushState({}, "", "/game?pieceCount=6&memorizeTime=10&source=daily");
});

afterEach(() => {
  act(() => useGameStore.getState().resetGame());
  jest.useRealTimers();
  jest.restoreAllMocks();
  Reflect.deleteProperty(window, "gtag");
});

async function openToStart() {
  render(<GamePage />);
  await act(async () => {});
  return screen.getByRole("button", { name: "Start game" });
}

async function playToSubmit() {
  fireEvent.click(await openToStart());
  await advance(3000);
  fireEvent.click(screen.getByRole("button", { name: "Hide board" }));
  fireEvent.click(screen.getByRole("button", { name: "Submit" }));
}

describe("GamePage today's board behind Start", () => {
  it("draws the veiled empty board with Start held on the first render, never the configuration form", () => {
    jest.mocked(openDaily).mockReturnValue(new Promise(() => {}));
    document.documentElement.setAttribute("data-round-entry", "daily");

    render(<GamePage />);

    expect(document.documentElement.getAttribute("data-round-entry")).toBeNull();
    expect(screen.getByRole("button", { name: "Start game" })).toBeDisabled();
    expect(screen.getByText("Daily board · Wednesday, October 14")).toBeInTheDocument();
    expect(screen.getByText("7 pieces · 10 s to study")).toBeInTheDocument();
    expect(document.querySelector("[data-game-config]")).toBeNull();
    expect([board()?.getAttribute("data-round-phase"), pieces()]).toEqual(["idle", 0]);
  });

  it("spends the day's try on Start, counts 3, 2, 1 over the empty board, then studies the position with round_start sent once", async () => {
    const start = await openToStart();
    const beforeStart = { enabled: !start.hasAttribute("disabled"), opened: localStorage.getItem(OPENED_KEY), phase: board()?.getAttribute("data-round-phase"), pieces: pieces() };

    fireEvent.click(start);
    const counted = [count()];
    await advance(1000);
    counted.push(count());
    await advance(1000);
    counted.push(count());
    const lastSecond = { phase: board()?.getAttribute("data-round-phase"), pieces: pieces(), starts: gtag.mock.calls.length };
    await advance(1000);

    expect(beforeStart).toEqual({ enabled: true, opened: null, phase: "ready", pieces: 0 });
    expect(localStorage.getItem(OPENED_KEY)).toBe("2026-10-14");
    expect(counted).toEqual(["3", "2", "1"]);
    expect(lastSecond).toEqual({ phase: "countdown", pieces: 0, starts: 0 });
    expect([board()?.getAttribute("data-round-phase"), pieces(), count()]).toEqual(["study", 6, undefined]);
    expect(gtag.mock.calls.filter(([, name]) => name === "round_start")).toEqual([
      ["event", "round_start", { piece_count: 6, memorize_time: 10, round_source: "daily" }],
    ]);
  });

  it("takes a scored daily round to today's board once the record has kept it, without the result screen", async () => {
    let kept: (saved: boolean) => void = () => {};
    jest.mocked(recordLabRound).mockReturnValue(new Promise((resolve) => (kept = resolve)));
    await playToSubmit();
    const whileSaving = { saving: screen.queryByText("Saving your result…") !== null, replaced: mockReplace.mock.calls.length };

    await act(async () => kept(true));

    expect(whileSaving).toEqual({ saving: true, replaced: 0 });
    expect(mockReplace.mock.calls).toEqual([[{ pathname: "/daily", query: { played: "1" } }]]);
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });

  it("keeps the result screen when this device could not keep the round", async () => {
    jest.mocked(recordLabRound).mockResolvedValue(false);
    await playToSubmit();
    await act(async () => {});

    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.queryByText("Saving your result…")).toBeNull();
  });
});
