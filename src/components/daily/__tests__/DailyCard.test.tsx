import { render, screen } from "@/test-utils/intl";
import { DailyCard } from "@/components/daily/DailyCard";
import type { DailyBoard, DailyRound } from "@/lib/lab/daily";

const playedWith = (squares: string): DailyBoard => ({
  status: "played",
  day: "2026-10-13",
  streak: { current: 1, best: 1 } as never,
  round: {
    v: 2,
    kind: "daily",
    dailyDay: "2026-10-13",
    correct: 4,
    wrong: 1,
    extra: 0,
    solveMs: 12_340,
    config: { pieceCount: 6, memorizeSeconds: 10, difficulty: "medium" },
    squares,
  } as unknown as DailyRound,
});

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ country: null }) });
});

describe("the daily result grid's description", () => {
  it.each([
    ["one", "cccc" + "w" + "m" + ".".repeat(58), "Your squares: 4 correct, 1 wrong piece, 1 missed, 0 extra"],
    ["two", "cccc" + "ww" + ".".repeat(58), "Your squares: 4 correct, 2 wrong pieces, 0 missed, 0 extra"],
  ])("counts %s wrong piece in the right number", (_case, squares, label) => {
    render(<DailyCard board={playedWith(squares)} setting={null} joined={null} standing={null} onJoined={jest.fn()} />);

    expect(screen.getByRole("img", { name: label })).toBeInTheDocument();
  });
});
