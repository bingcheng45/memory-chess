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
  ])("matches the noun to %s wrong", (_case, squares, label) => {
    render(<DailyCard board={playedWith(squares)} setting={null} joined={null} standing={null} onJoined={jest.fn()} />);

    expect(screen.getByRole("img", { name: label })).toBeInTheDocument();
  });
});

describe("the Telegram line", () => {
  const squares = "cccc" + "w" + "m" + ".".repeat(58);
  const line = /Talk about today's board with other players\. Hide any answers in a spoiler\./;

  it("is not shown before the player has joined today's board", () => {
    render(<DailyCard board={playedWith(squares)} setting={null} joined={null} standing={null} onJoined={jest.fn()} />);

    expect(screen.queryByText(line)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Join the Telegram group" })).not.toBeInTheDocument();
  });

  it("is shown once the player has joined", () => {
    render(<DailyCard board={playedWith(squares)} setting={null} joined={{} as never} standing={null} onJoined={jest.fn()} />);

    expect(screen.getByText(line)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Join the Telegram group" });
    expect(link).toHaveAttribute("href", "https://t.me/TheMemoryChess");
    expect(link).toHaveAttribute("id", "community-daily");
  });
});
