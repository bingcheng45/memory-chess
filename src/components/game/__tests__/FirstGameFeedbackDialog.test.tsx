import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import FirstGameFeedbackDialog, {
  FEEDBACK_COOLDOWN_MS,
  FEEDBACK_NEXT_ELIGIBLE_STORAGE_KEY,
  FEEDBACK_PROMPT_DELAY_MS,
} from "@/components/game/FirstGameFeedbackDialog";

const game = {
  accuracy: 75,
  correctPieces: 6,
  pieceCount: 8,
  difficulty: "custom" as const,
  memorizationTime: 10,
  solutionTime: 18.25,
};

describe("FirstGameFeedbackDialog", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-08-16T04:00:00.000Z"));
    window.localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  function openPrompt() {
    render(<FirstGameFeedbackDialog game={game} />);
    act(() => {
      jest.advanceTimersByTime(FEEDBACK_PROMPT_DELAY_MS);
    });
  }

  it("opens after the result-screen delay and records a 24-hour cooldown", () => {
    const now = Date.now();
    openPrompt();

    expect(
      screen.getByRole("heading", {
        name: "Thanks for playing Memory Chess!",
      }),
    ).toBeInTheDocument();
    expect(
      Number(window.localStorage.getItem(FEEDBACK_NEXT_ELIGIBLE_STORAGE_KEY)),
    ).toBe(now + FEEDBACK_PROMPT_DELAY_MS + FEEDBACK_COOLDOWN_MS);
  });

  it("does not open during the cooldown or automatically at its boundary", () => {
    const nextEligibleAt = Date.now() + 1_000;
    window.localStorage.setItem(
      FEEDBACK_NEXT_ELIGIBLE_STORAGE_KEY,
      String(nextEligibleAt),
    );

    const firstRender = render(<FirstGameFeedbackDialog game={game} />);
    act(() => {
      jest.advanceTimersByTime(2_000);
    });
    expect(
      screen.queryByText("Thanks for playing Memory Chess!"),
    ).not.toBeInTheDocument();

    firstRender.unmount();
    render(<FirstGameFeedbackDialog game={game} />);
    act(() => {
      jest.advanceTimersByTime(FEEDBACK_PROMPT_DELAY_MS);
    });
    expect(
      screen.getByText("Thanks for playing Memory Chess!"),
    ).toBeInTheDocument();
  });

  it("refreshes the cooldown when dismissed", () => {
    openPrompt();
    const initialCooldown = Number(
      window.localStorage.getItem(FEEDBACK_NEXT_ELIGIBLE_STORAGE_KEY),
    );

    act(() => {
      jest.advanceTimersByTime(5_000);
    });
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));

    expect(
      Number(window.localStorage.getItem(FEEDBACK_NEXT_ELIGIBLE_STORAGE_KEY)),
    ).toBe(initialCooldown + 5_000);
    expect(
      screen.queryByText("Thanks for playing Memory Chess!"),
    ).not.toBeInTheDocument();
  });

  it("requires a rating before submission", () => {
    openPrompt();
    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please choose a star rating.",
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("submits anonymous feedback and refreshes the cooldown", async () => {
    jest.mocked(global.fetch).mockResolvedValueOnce({ ok: true } as Response);
    openPrompt();

    fireEvent.click(screen.getByRole("radio", { name: "5 stars" }));
    fireEvent.change(
      screen.getByLabelText(
        /How did playing feel, and what would make it better/i,
      ),
      { target: { value: "A calmer timer would help." } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));

    await waitFor(() => {
      expect(
        screen.getByText("Thank you for helping us improve"),
      ).toBeInTheDocument();
    });

    const request = jest.mocked(global.fetch).mock.calls[0];
    expect(request[0]).toBe("/api/feedback");
    expect(JSON.parse((request[1] as RequestInit).body as string)).toEqual({
      ...game,
      rating: 5,
      feedback: "A calmer timer would help.",
    });
  });

  it("keeps a failed submission open and retryable", async () => {
    jest.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response);
    openPrompt();
    fireEvent.click(screen.getByRole("radio", { name: "3 stars" }));
    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "We could not send your feedback.",
      );
    });
    expect(
      screen.getByText("Thanks for playing Memory Chess!"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send feedback" })).toBeEnabled();
  });

  it("falls back safely when local storage is unavailable", () => {
    jest.setSystemTime(new Date("2030-08-16T04:00:00.000Z"));
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });

    openPrompt();

    expect(
      screen.getByText("Thanks for playing Memory Chess!"),
    ).toBeInTheDocument();
  });
});
