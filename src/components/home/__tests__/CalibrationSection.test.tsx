import { act, fireEvent, renderWithIntl, screen } from "@/test-utils/intl";
import { CalibrationSection } from "@/components/home/CalibrationSection";
import { LibrarySection, LIBRARY_GUIDES } from "@/components/home/LibrarySection";
import { LEARN_SLUGS } from "@/lib/seo/learn";
import { recordLabRound } from "@/lib/lab/recordRound";

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

    expect(screen.getByText("Phase 03 · Rebuild from memory")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `${square}, empty` })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: pieceName }));
    fireEvent.click(screen.getByRole("button", { name: `${square}, empty` }));
    expect(screen.getByRole("button", { name: `${square}, ${pieceName}` })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Submit reading" }));

    expect(screen.getByText("Run complete")).toBeInTheDocument();
    expect(screen.getByText("1 / 6")).toBeInTheDocument();
    expect(recordLabRound).toHaveBeenCalledTimes(1);
    expect(recordLabRound).toHaveBeenCalledWith(
      expect.objectContaining({ source: "calibration", pieceCount: 6, memorizeSeconds: 10, memorizeMs: 10000 }),
    );
    expect(screen.getByText("Wrong pieces").nextSibling).toHaveTextContent("5");
    expect(screen.getByText(/start on Easy, 2 pieces at 10s/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Play Easy/ })).toHaveAttribute(
      "href",
      "/game?pieceCount=2&memorizeTime=10",
    );
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
