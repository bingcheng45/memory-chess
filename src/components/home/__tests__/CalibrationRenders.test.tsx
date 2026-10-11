import { act, fireEvent, renderWithIntl, screen } from "@/test-utils/intl";
import { CalibrationSection } from "@/components/home/CalibrationSection";

jest.mock("@/lib/lab/recordRound", () => ({ recordLabRound: jest.fn(() => Promise.resolve(true)) }));

const mockBoardRenders = { count: 0 };
jest.mock("@/components/home/BoardFigure", () => {
  const actual = jest.requireActual("@/components/home/BoardFigure");
  return {
    ...actual,
    usePieceName: () => {
      mockBoardRenders.count += 1;
      return actual.usePieceName();
    },
  };
});

describe("the calibration clock", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("ticks the clock without redrawing the board or the readout", async () => {
    renderWithIntl(<CalibrationSection />);
    fireEvent.click(screen.getByRole("button", { name: /Start calibration/ }));
    await screen.findByText("Phase 01 · Study");
    mockBoardRenders.count = 0;

    for (let elapsed = 0; elapsed < 5000; elapsed += 50) {
      act(() => {
        jest.advanceTimersByTime(50);
      });
    }

    const left = Number(screen.getByTestId("round-clock").textContent?.replace("s", ""));
    expect(left).toBeGreaterThan(4.5);
    expect(left).toBeLessThan(5.2);
    expect(mockBoardRenders.count).toBe(0);
  });
});
