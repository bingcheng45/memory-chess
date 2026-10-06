import { act, fireEvent, renderWithIntl, screen } from "@/test-utils/intl";
import { CalibrationSection } from "@/components/home/CalibrationSection";
import { LibrarySection, LIBRARY_GUIDES } from "@/components/home/LibrarySection";
import { LEARN_SLUGS } from "@/lib/seo/learn";

describe("CalibrationSection", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("runs a round: study, blank board, rebuild one piece, read the card", () => {
    renderWithIntl(<CalibrationSection />);

    fireEvent.click(screen.getByRole("button", { name: /Start calibration/ }));
    const studied = screen
      .getAllByRole("button", { name: /^[a-h][1-8], / })
      .filter((cell) => !cell.getAttribute("aria-label")?.endsWith("empty"));
    expect(studied).toHaveLength(6);

    const [square, pieceName] = studied[0].getAttribute("aria-label")!.split(", ");
    act(() => {
      jest.advanceTimersByTime(8100);
    });

    expect(screen.getByText("Phase 03 · Rebuild from memory")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `${square}, empty` })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: pieceName }));
    fireEvent.click(screen.getByRole("button", { name: `${square}, empty` }));
    expect(screen.getByRole("button", { name: `${square}, ${pieceName}` })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Submit reading" }));

    expect(screen.getByText("Run complete")).toBeInTheDocument();
    expect(screen.getByText("1 / 6")).toBeInTheDocument();
    expect(screen.getByText(/start on Easy, 2 pieces at 10s/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Play Easy/ })).toHaveAttribute(
      "href",
      "/game?pieceCount=2&memorizeTime=10",
    );
  });

  it("moves focus across the board with the arrow keys once the board clears", () => {
    renderWithIntl(<CalibrationSection />);
    fireEvent.click(screen.getByRole("button", { name: /Start calibration/ }));
    act(() => {
      jest.advanceTimersByTime(8100);
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
  });
});
