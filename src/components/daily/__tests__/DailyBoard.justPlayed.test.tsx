import { act, render, screen } from "@/test-utils/intl";
import { DailyBoard } from "@/components/daily/DailyBoard";
import type { DailyRound } from "@/lib/lab/daily";
import type { CountryCode } from "@/lib/leaderboard/countries";
import { useSettingsStore } from "@/stores/settingsStore";

const TODAYS_ROUND = {
  v: 2,
  kind: "daily",
  dailyDay: "2026-10-14",
  endedAt: Date.parse("2026-10-14T12:01:00Z"),
  correct: 5,
  wrong: 1,
  extra: 0,
  solveMs: 9_100,
  memorizeMs: 10_000,
  config: { pieceCount: 7, memorizeSeconds: 10, difficulty: "medium" },
  squares: "ccccc" + "w" + ".".repeat(58),
} as unknown as DailyRound;

let mockRecords: readonly DailyRound[] = [];
jest.mock("@/hooks/useLabData", () => ({
  useLabData: () => ({ storage: "available", records: mockRecords }),
}));

const PROMPT = "5 of 7 right Put your score on today's board.";
const prompt = () => document.querySelector(".daily-prompt")?.textContent ?? null;

beforeEach(() => {
  jest.useFakeTimers({ now: Date.parse("2026-10-14T12:02:00Z"), doNotFake: ["queueMicrotask", "nextTick"] });
  window.localStorage.clear();
  useSettingsStore.setState({ countryCode: "SG" as CountryCode });
  mockRecords = [TODAYS_ROUND];
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ data: [] }) })) as unknown as typeof fetch;
});

afterEach(() => {
  jest.useRealTimers();
  window.history.pushState({}, "", "/");
});

describe("today's board straight after the round", () => {
  it("leads with the score and a call to join, puts the cursor in the name field and takes the marker off the address", async () => {
    window.history.pushState({}, "", "/daily?played=1");

    render(<DailyBoard />);
    await act(async () => {});

    expect(prompt()).toBe(PROMPT);
    expect(document.activeElement).toBe(screen.getByLabelText("Name"));
    expect(document.querySelector("[data-just-played]")).not.toBeNull();
    expect(window.location.pathname + window.location.search).toBe("/daily");
  });

  it("shows the result without the prompt on an ordinary visit", async () => {
    window.history.pushState({}, "", "/daily");

    render(<DailyBoard />);
    await act(async () => {});

    expect([prompt(), screen.getByText("5 of 7 right").tagName]).toEqual([null, "STRONG"]);
    expect(document.activeElement).toBe(document.body);
  });
});
