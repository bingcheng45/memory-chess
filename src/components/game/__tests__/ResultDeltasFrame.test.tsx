import { render, screen } from "@/test-utils/intl";
import ResultDeltasFrame from "@/components/game/ResultDeltasFrame";

const withFrameTop = (top: number) => jest.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ top } as DOMRect);

afterEach(() => jest.restoreAllMocks());

describe("ResultDeltasFrame", () => {
  it("keeps the tallest list's height when it starts in view", () => {
    withFrameTop(window.innerHeight - 1);

    render(<ResultDeltasFrame>figures</ResultDeltasFrame>);

    expect(screen.getByTestId("result-deltas-frame").className).toMatch(/^min-h-\[\d+px\]/);
  });

  it("keeps no height when it starts below the fold", () => {
    withFrameTop(window.innerHeight);

    render(<ResultDeltasFrame>figures</ResultDeltasFrame>);

    expect(screen.getByTestId("result-deltas-frame").className).toBe("");
  });
});
