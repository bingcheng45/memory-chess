import { act, fireEvent, renderWithIntl, screen, waitFor } from "@/test-utils/intl";
import { BoardPanel } from "@/components/home/LabBoardPanel";
import { entriesChoice } from "@/components/home/labChoices";
import { trackEvent } from "@/lib/analytics/events";
import { ENTRIES_KEY } from "@/lib/lab/entries";

jest.mock("@/lib/analytics/events", () => ({ trackEvent: jest.fn() }));

const MEDIUM_ID = "0b5e8f7c-3c1a-4e2b-9d4f-1a2b3c4d5e6f";
const HARD_ID = "7d1f0a2e-5b6c-4d8e-8f9a-0b1c2d3e4f5a";
const TIME = /\d{1,2}:\d{2}(\s?[AP]M)?/.source;

const medium = {
  id: MEDIUM_ID,
  difficulty: "medium",
  country: "SG",
  score: { correctPieces: 5, totalWrongPieces: 1, memorizeTime: 9.25, solutionTime: 14.5 },
  submittedAt: Date.UTC(2026, 9, 8, 12),
};
const hard = { ...medium, id: HARD_ID, difficulty: "hard", country: "ZZ", score: { ...medium.score, correctPieces: 9 }, submittedAt: Date.UTC(2026, 9, 9, 12) };

function keep(entries: object) {
  window.localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

/** Answers each fetch in turn, shaped like a Response for the fields the client reads. */
function answers(...replies: { status: number; body?: unknown; retryAfter?: string }[]) {
  const queue = [...replies];
  global.fetch = jest.fn(async () => {
    const { status, body = {}, retryAfter } = queue.shift() ?? { status: 500 };
    return { status, ok: status === 200, headers: { get: (name: string) => (name === "Retry-After" ? retryAfter ?? null : null) }, json: async () => body };
  }) as unknown as typeof fetch;
}

const rank = (standing: object) => ({ status: 200, body: { data: { difficulty: "medium", country: null, ...standing } } });
const status = () => screen.getByRole("status");
const press = () => act(async () => fireEvent.click(screen.getByRole("button", { name: "Check my standing" })));

describe("BoardPanel", () => {
  beforeEach(() => {
    window.localStorage.clear();
    entriesChoice.reset();
    jest.mocked(trackEvent).mockClear();
    jest.spyOn(window.navigator, "onLine", "get").mockReturnValue(true);
    global.fetch = jest.fn();
  });

  afterEach(() => jest.restoreAllMocks());

  it("shows a player who never submitted the Sample sketch and how to get a standing, with nothing to check", () => {
    renderWithIntl(<BoardPanel ready />);

    expect(screen.getByText("Sample")).toBeInTheDocument();
    expect(screen.getByText("Submit a score from the result screen, then check where it stands, worldwide or in your country.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Check my standing" })).toBeNull();
    expect(status()).toHaveTextContent("");
  });

  it("keeps the Sample sketch while the record loads, even with an entry stored", () => {
    keep({ medium });

    renderWithIntl(<BoardPanel ready={false} />);

    expect(screen.getByText("Sample")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Check my standing" })).toBeNull();
  });

  it("shows a stored entry without asking the server, and reads its world rank only on a press", async () => {
    keep({ medium });
    answers(rank({ rank: 14, total: 200 }));

    renderWithIntl(<BoardPanel ready />);

    expect(screen.getByText("Your record")).toBeInTheDocument();
    expect(screen.getByText("Your best entry on Medium: 5 correct pieces, sent Oct 8.")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();

    await press();

    expect(jest.mocked(global.fetch).mock.calls).toEqual([[`/api/leaderboard/rank?id=${MEDIUM_ID}&scope=world`, { cache: "no-store" }]]);
    expect(status().textContent).toMatch(
      new RegExp(`^Rank 14 of 200 entries on Medium, worldwide\\. Checked at ${TIME}\\. It is on the public board, which shows the top 200\\.$`),
    );
    expect(jest.mocked(trackEvent).mock.calls).toEqual([[{ name: "lab_panel_action", params: { panel: "board", action: "check" } }]]);
  });

  it("says how the rank moved when it changed between two presses", async () => {
    keep({ medium });
    answers(rank({ rank: 14, total: 200 }), rank({ rank: 1204, total: 5320 }));
    renderWithIntl(<BoardPanel ready />);

    await press();
    await press();

    expect(status().textContent).toMatch(
      new RegExp(`^Rank 1,204 of 5,320 entries on Medium, worldwide\\. Checked at ${TIME}\\. The public board shows the top 200\\. Down 1,190 places since ${TIME}\\.$`),
    );
  });

  it("ranks within the entry's own country when the player picks it", async () => {
    keep({ medium });
    answers({ status: 200, body: { data: { difficulty: "medium", country: "SG", rank: 1, total: 3 } } });
    renderWithIntl(<BoardPanel ready />);

    fireEvent.click(screen.getByRole("radio", { name: /Singapore/ }));
    await press();

    expect(jest.mocked(global.fetch).mock.calls[0][0]).toBe(`/api/leaderboard/rank?id=${MEDIUM_ID}&scope=country`);
    expect(status().textContent).toMatch(new RegExp(`^Rank 1 of 3 entries on Medium in Singapore\\. Checked at ${TIME}\\.$`));
  });

  it("lets a player with entries on two difficulties pick one, and offers no country for an entry sent with the world", async () => {
    keep({ medium, hard });
    answers(rank({ difficulty: "medium", rank: 2, total: 9 }));
    renderWithIntl(<BoardPanel ready />);

    expect(screen.getByRole("radio", { name: "Hard" })).toBeChecked();
    expect(screen.queryByRole("radiogroup", { name: "Rank among" })).toBeNull();

    fireEvent.click(screen.getByRole("radio", { name: "Medium" }));
    expect(screen.getByRole("radiogroup", { name: "Rank among" })).toBeInTheDocument();
    await press();

    expect(jest.mocked(global.fetch).mock.calls[0][0]).toBe(`/api/leaderboard/rank?id=${MEDIUM_ID}&scope=world`);
  });

  it("forgets an entry the board no longer has, says so, and falls back to the sketch", async () => {
    keep({ medium });
    answers({ status: 404, body: { error: "gone" } });
    renderWithIntl(<BoardPanel ready />);

    await press();

    expect(status().textContent).toMatch(
      new RegExp(`^Your Medium entry is no longer on the leaderboard, so this device no longer keeps it\\. Boards are sometimes cleaned or reset\\. Checked at ${TIME}\\.$`),
    );
    expect(window.localStorage.getItem(ENTRIES_KEY)).toBeNull();
    expect(screen.getByText("Sample")).toBeInTheDocument();
  });

  it("says plainly when checks are limited, the browser is offline, or the board cannot be reached", async () => {
    keep({ medium });
    answers({ status: 429, retryAfter: "37" }, { status: 503 });
    renderWithIntl(<BoardPanel ready />);
    const said = [];

    await press();
    said.push(status().textContent);
    await press();
    said.push(status().textContent);
    jest.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);
    await press();
    said.push(status().textContent);

    expect(said).toEqual([
      "Too many checks from your connection. Try again in 37 seconds.",
      "The leaderboard could not be reached, so no standing was read. Try again later.",
      "You are offline, so nothing was sent. Connect and try again.",
    ]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(window.localStorage.getItem(ENTRIES_KEY)).not.toBeNull();
  });

  it("disables the button while a check is in flight, so one press sends one request", async () => {
    keep({ medium });
    let finish: (value: unknown) => void = () => {};
    global.fetch = jest.fn(() => new Promise((resolve) => (finish = resolve))) as unknown as typeof fetch;
    renderWithIntl(<BoardPanel ready />);

    fireEvent.click(screen.getByRole("button", { name: "Check my standing" }));
    const busy = screen.getByRole("button", { name: "Checking..." });
    fireEvent.click(busy);

    expect(busy).toBeDisabled();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    await act(async () => finish({ status: 503, ok: false, headers: { get: () => null }, json: async () => ({}) }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Check my standing" })).toBeEnabled());
  });
});
