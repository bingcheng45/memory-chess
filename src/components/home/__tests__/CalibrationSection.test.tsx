import { act, fireEvent, renderWithIntl, screen, within } from "@/test-utils/intl";
import { CalibrationSection } from "@/components/home/CalibrationSection";
import { LibrarySection, LIBRARY_GUIDES } from "@/components/home/LibrarySection";
import { LEARN_SLUGS } from "@/lib/seo/learn";
import { recordLabRound } from "@/lib/lab/recordRound";
import { BOARD_SQUARES, type SquareName } from "@/lib/game/board";
import type { PieceColor, PieceType } from "@/types/chess";
import { pieceTypeToFenChar } from "@/utils/chessPieces";

const pieceLetter = (name: string) => {
  const [color, type] = name.split(" ");
  return pieceTypeToFenChar(type as PieceType, color as PieceColor);
};

jest.mock("@/lib/lab/recordRound", () => ({ recordLabRound: jest.fn(() => Promise.resolve(true)) }));

describe("CalibrationSection", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("runs a round: study, blank board, rebuild one piece, read the card", async () => {
    renderWithIntl(<CalibrationSection />);

    fireEvent.click(screen.getByRole("button", { name: /Start calibration/ }));
    await screen.findByText("Phase 01 · Study");
    const studied = screen
      .getAllByRole("button", { name: /^[a-h][1-8], / })
      .filter((cell) => !cell.getAttribute("aria-label")?.endsWith("empty"));
    expect(studied).toHaveLength(6);
    expect(
      studied.map((cell) => cell.getAttribute("aria-label")!.split(", ")[1]).filter((name) => name.endsWith("king")).sort(),
    ).toEqual(["black king", "white king"]);

    const [square, pieceName] = studied[0].getAttribute("aria-label")!.split(", ");
    act(() => {
      jest.advanceTimersByTime(10100);
    });

    expect(screen.getByText("Phase 06 · Rebuild")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `${square}, empty` })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: pieceName }));
    act(() => {
      jest.advanceTimersByTime(1400);
    });
    fireEvent.click(screen.getByRole("button", { name: `${square}, empty` }));
    expect(screen.getByRole("button", { name: `${square}, ${pieceName}` })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Submit reading" }));

    expect(screen.getByText("Run complete")).toBeInTheDocument();
    expect(screen.getByText("Phase 07 · Score")).toBeInTheDocument();
    expect(screen.getByText("1 / 6")).toBeInTheDocument();
    expect(recordLabRound).toHaveBeenCalledTimes(1);
    expect(recordLabRound).toHaveBeenCalledWith(
      expect.objectContaining({ source: "calibration", startSource: "calibration", pieceCount: 6, memorizeSeconds: 10, memorizeMs: 10000, removals: 0 }),
    );
    expect(jest.mocked(recordLabRound).mock.calls[0][0].placements).toEqual([
      [1500, BOARD_SQUARES.indexOf(square as SquareName), pieceLetter(pieceName)],
    ]);
    expect(screen.getByText("Wrong pieces").nextSibling).toHaveTextContent("5");
    expect(screen.getByText(/start on Easy, 2 pieces at 10s/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Play Easy/ })).toHaveAttribute(
      "href",
      "/game?pieceCount=2&memorizeTime=10&source=calibration_cta",
    );
  });

  it("reports the calibration run to GA4 as a round start", async () => {
    const gtag = jest.fn();
    window.gtag = gtag;
    renderWithIntl(<CalibrationSection />);

    fireEvent.click(screen.getByRole("button", { name: /Start calibration/ }));
    await screen.findByText("Phase 01 · Study");

    expect(gtag.mock.calls).toEqual([["event", "round_start", { piece_count: 6, memorize_time: 10, source: "calibration" }]]);
    Reflect.deleteProperty(window, "gtag");
  });

  it("reports a finished calibration run to GA4 as a round complete from calibration", async () => {
    const gtag = jest.fn();
    window.gtag = gtag;
    renderWithIntl(<CalibrationSection />);
    fireEvent.click(screen.getByRole("button", { name: /Start calibration/ }));
    await screen.findByText("Phase 01 · Study");
    const [square, pieceName] = screen
      .getAllByRole("button", { name: /^[a-h][1-8], / })
      .find((cell) => !cell.getAttribute("aria-label")?.endsWith("empty"))!
      .getAttribute("aria-label")!
      .split(", ");
    act(() => {
      jest.advanceTimersByTime(10100);
    });

    fireEvent.click(screen.getByRole("button", { name: pieceName }));
    fireEvent.click(screen.getByRole("button", { name: `${square}, empty` }));
    fireEvent.click(screen.getByRole("button", { name: "Submit reading" }));

    expect(gtag.mock.calls.filter(([, name]) => name === "round_complete")).toEqual([
      ["event", "round_complete", { piece_count: 6, memorize_time: 10, correct_pieces: 1, accuracy: 17, source: "calibration" }],
    ]);
    Reflect.deleteProperty(window, "gtag");
  });

  it("moves focus across the board with the arrow keys once the board clears", async () => {
    renderWithIntl(<CalibrationSection />);
    fireEvent.click(screen.getByRole("button", { name: /Start calibration/ }));
    await screen.findByText("Phase 01 · Study");
    act(() => {
      jest.advanceTimersByTime(10100);
    });

    const a8 = screen.getByRole("button", { name: /^a8, / });
    a8.focus();
    fireEvent.keyDown(a8, { key: "ArrowRight" });
    expect(document.activeElement?.getAttribute("aria-label")).toMatch(/^b8, /);
    fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
    expect(document.activeElement?.getAttribute("aria-label")).toMatch(/^b7, /);
  });
});

const controls = () => within(screen.getByRole("group", { name: "Round controls" }));
const buttonState = () =>
  controls()
    .getAllByRole("button")
    .map((button) => [button.textContent?.trim(), (button as HTMLButtonElement).disabled]);
const seconds = (text: string | null) => Number(text?.replace("s", ""));

async function startRound() {
  fireEvent.click(screen.getByRole("button", { name: /Start calibration/ }));
  await screen.findByText("Phase 01 · Study");
}

function studiedPiece(): [string, string] {
  const label = screen
    .getAllByRole("button", { name: /^[a-h][1-8], / })
    .find((cell) => !cell.getAttribute("aria-label")?.endsWith("empty"))!
    .getAttribute("aria-label")!;
  const [square, pieceName] = label.split(", ");
  return [square, pieceName];
}

describe("the calibration round controls", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("offers a primary Start and a disabled Submit before the round", () => {
    renderWithIntl(<CalibrationSection />);

    expect(buttonState()).toEqual([["Start calibration", false], ["Submit reading", true]]);
    expect(controls().getByRole("button", { name: /Start calibration/ })).toHaveAttribute("data-primary");
    expect(screen.getByRole("button", { name: "Clear board" })).toBeDisabled();
  });

  it("swaps Start for Done while studying, with Submit still disabled", async () => {
    renderWithIntl(<CalibrationSection />);
    await startRound();

    expect(buttonState()).toEqual([["Done", false], ["Submit reading", true]]);
    expect(controls().getByRole("button", { name: "Done" })).toHaveAttribute("data-primary");
    expect(screen.getByText(/Study time is saved with your reading/)).toBeInTheDocument();
  });

  it("rebuilds at once on Done and shows the real study time as exposure", async () => {
    renderWithIntl(<CalibrationSection />);
    await startRound();
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    fireEvent.click(controls().getByRole("button", { name: "Done" }));

    expect(screen.getByText("Phase 06 · Rebuild")).toBeInTheDocument();
    expect(buttonState()).toEqual([["Restart", false], ["Submit reading", false]]);
    expect(controls().getByRole("button", { name: "Submit reading" })).toHaveAttribute("data-primary");
    expect(controls().getByRole("button", { name: "Restart" })).not.toHaveAttribute("data-primary");
    const exposure = screen.getByText("Exposure").nextSibling?.textContent ?? "";
    expect(exposure).toMatch(/^3\.\d{3}s$/);
    expect(seconds(exposure)).toBeLessThan(3.2);
  });

  it("saves the study time actually used with the round", async () => {
    renderWithIntl(<CalibrationSection />);
    await startRound();
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    fireEvent.click(controls().getByRole("button", { name: "Done" }));
    fireEvent.click(controls().getByRole("button", { name: "Submit reading" }));

    const saved = jest.mocked(recordLabRound).mock.calls.at(-1)![0];
    expect(saved.memorizeMs).toBeGreaterThanOrEqual(2000);
    expect(saved.memorizeMs).toBeLessThan(2200);
    expect(saved.memorizeSeconds).toBe(10);
  });

  it("clears the placed pieces from the icon button next to the row", async () => {
    renderWithIntl(<CalibrationSection />);
    await startRound();
    const [square, pieceName] = studiedPiece();
    fireEvent.click(controls().getByRole("button", { name: "Done" }));
    fireEvent.click(screen.getByRole("button", { name: pieceName }));
    fireEvent.click(screen.getByRole("button", { name: `${square}, empty` }));
    expect(screen.getByRole("button", { name: `${square}, ${pieceName}` })).toBeInTheDocument();

    const clear = screen.getByRole("button", { name: "Clear board" });
    expect(clear).toBeEnabled();
    expect(clear).toHaveAttribute("title", "Clear board");
    expect(clear).toHaveTextContent("");
    expect(controls().queryByRole("button", { name: "Clear board" })).toBeNull();
    fireEvent.click(clear);

    expect(screen.getByRole("button", { name: `${square}, empty` })).toBeInTheDocument();
  });

  it("keeps two buttons once scored: Run again as primary and Submit disabled", async () => {
    renderWithIntl(<CalibrationSection />);
    await startRound();
    fireEvent.click(controls().getByRole("button", { name: "Done" }));
    fireEvent.click(controls().getByRole("button", { name: "Submit reading" }));

    expect(screen.getByText("Phase 07 · Score")).toBeInTheDocument();
    expect(buttonState()).toEqual([["Run again", false], ["Submit reading", true]]);
    expect(controls().getByRole("button", { name: "Run again" })).toHaveAttribute("data-primary");
    expect(screen.getByRole("button", { name: "Clear board" })).toBeDisabled();
  });

  it("shows milliseconds on the study clock, the rebuild clock and the readout times", async () => {
    renderWithIntl(<CalibrationSection />);
    expect(screen.getByRole("timer")).toHaveTextContent("10.000s");
    await startRound();
    act(() => {
      jest.advanceTimersByTime(1250);
    });
    expect(screen.getByRole("timer").textContent).toMatch(/^[89]\.\d{3}s$/);

    fireEvent.click(controls().getByRole("button", { name: "Done" }));
    act(() => {
      jest.advanceTimersByTime(2500);
    });
    const rebuildClock = screen.getByRole("timer").textContent;
    expect(rebuildClock).toMatch(/^2\.\d{3}s$/);

    fireEvent.click(controls().getByRole("button", { name: "Submit reading" }));
    expect(screen.getByText("Rebuild time").nextSibling?.textContent).toMatch(/^2\.\d{3}s$/);
    expect(screen.getByText("Exposure").nextSibling?.textContent).toMatch(/^1\.\d{3}s$/);
  });
});

describe("LibrarySection", () => {
  it("links only to Learn guides that exist", () => {
    expect(LIBRARY_GUIDES.filter(({ slug }) => !LEARN_SLUGS.includes(slug))).toEqual([]);
  });

  it("renders each guide as a link to its page", () => {
    renderWithIntl(<LibrarySection />);
    expect(screen.getByRole("link", { name: /Board vision/ })).toHaveAttribute(
      "href",
      "/learn/how-to-see-the-whole-board-in-chess",
    );
    expect(screen.getByRole("link", { name: /Blindfold chess training/ })).toHaveAttribute(
      "href",
      "/learn/blindfold-chess-training-for-beginners",
    );
    expect(screen.getByRole("link", { name: "How to stop blundering" })).toHaveAttribute(
      "href",
      "/learn/how-to-stop-blundering-in-chess",
    );
    expect(screen.queryByRole("link", { name: /Beginner Guide/ })).toBeNull();
  });
});
