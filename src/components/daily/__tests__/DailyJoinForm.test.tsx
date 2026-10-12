import { fireEvent, render, screen, waitFor } from "@/test-utils/intl";
import { DailyJoinForm } from "@/components/daily/DailyJoinForm";
import type { DailyRound } from "@/lib/lab/daily";
import { WORLD_CODE, type CountryCode } from "@/lib/leaderboard/countries";
import { useSettingsStore } from "@/stores/settingsStore";

const ROUND = {
  v: 2,
  kind: "daily",
  dailyDay: "2026-10-13",
  correct: 4,
  wrong: 2,
  extra: 0,
  solveMs: 12_340,
  memorizeMs: 8_000,
  config: { pieceCount: 6, memorizeSeconds: 10, difficulty: "medium" },
  squares: ".".repeat(64),
} as unknown as DailyRound;

const ENTRY_ID = "3c3c3c3c-0000-4000-8000-000000000003";

function serve(geo: string | null) {
  const posts: unknown[] = [];
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input).includes("/api/geo")) return { ok: true, json: async () => ({ country: geo }) };
    posts.push(JSON.parse(String(init?.body)));
    return { ok: true, json: async () => ({ success: true, data: { id: ENTRY_ID, ...JSON.parse(String(init?.body)) } }) };
  }) as unknown as typeof fetch;
  return posts;
}

function languages(tags: string[]) {
  Object.defineProperty(window.navigator, "languages", { value: tags, configurable: true });
}

const country = () => screen.getByLabelText("Country");

beforeEach(() => {
  window.localStorage.clear();
  useSettingsStore.setState({ countryCode: WORLD_CODE });
});

describe("the daily join form's country", () => {
  it("prefills Singapore from a connection read as SG and says so", async () => {
    serve("SG");
    languages(["en-US"]);

    render(<DailyJoinForm round={ROUND} onJoined={jest.fn()} />);

    expect(await screen.findByText("From your connection.")).toBeInTheDocument();
    expect(country()).toHaveTextContent("Singapore");
  });

  it("prefills Brazil from a pt-BR browser when the connection names no country", async () => {
    serve(null);
    languages(["pt-BR", "en"]);

    render(<DailyJoinForm round={ROUND} onJoined={jest.fn()} />);

    expect(await screen.findByText("From your browser language.")).toBeInTheDocument();
    expect(country()).toHaveTextContent("Brazil");
  });

  it("leaves the country empty and the form closed for a bare en browser with no connection country", async () => {
    serve(null);
    languages(["en"]);

    render(<DailyJoinForm round={ROUND} onJoined={jest.fn()} />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Poteto" } });

    expect(await screen.findByText("Pick the country you play for.")).toBeInTheDocument();
    expect(country()).toHaveTextContent("Choose a country");
    expect(screen.getByRole("button", { name: "Join the board" })).toBeDisabled();
  });

  it("keeps Japan, picked before on this device, over Singapore from the connection", async () => {
    serve("SG");
    languages(["en-SG"]);
    useSettingsStore.setState({ countryCode: "JP" as CountryCode });

    render(<DailyJoinForm round={ROUND} onJoined={jest.fn()} />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    expect(screen.getByText("Saved on this device.")).toBeInTheDocument();
    expect(country()).toHaveTextContent("Japan");
  });
});

describe("joining the daily board", () => {
  it("posts the day's six pieces and ten seconds, the rebuild time and the country, then hands back the day's entry", async () => {
    const posts = serve("SG");
    languages(["en-US"]);
    const onJoined = jest.fn();

    render(<DailyJoinForm round={ROUND} onJoined={onJoined} />);
    await screen.findByText("From your connection.");
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "  Poteto  " } });
    fireEvent.click(screen.getByRole("button", { name: "Join the board" }));

    await waitFor(() => expect(onJoined).toHaveBeenCalled());
    expect(posts).toEqual([
      {
        player_name: "Poteto",
        country_code: "SG",
        difficulty: "daily",
        daily_day: "2026-10-13",
        piece_count: 6,
        correct_pieces: 4,
        memorize_time: 10,
        solution_time: 12.34,
        total_wrong_pieces: 2,
        skill_rating: 1000,
      },
    ]);
    expect(onJoined.mock.calls[0][0]).toMatchObject({ id: ENTRY_ID, difficulty: "daily", dailyDay: "2026-10-13", country: "SG" });
    expect(useSettingsStore.getState().countryCode).toBe("SG");
  });

  it("offers no form for a try with no piece right, which the board cannot rank", () => {
    serve(null);

    render(<DailyJoinForm round={{ ...ROUND, correct: 0 }} onJoined={jest.fn()} />);

    expect(screen.queryByRole("button", { name: "Join the board" })).not.toBeInTheDocument();
    expect(screen.getByText(/No piece was right/)).toBeInTheDocument();
  });
});
