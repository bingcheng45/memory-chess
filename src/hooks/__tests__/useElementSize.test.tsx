import { useRef } from "react";
import { render, screen } from "@testing-library/react";
import { useElementSize } from "@/hooks/useElementSize";

function Measured() {
  const ref = useRef<HTMLDivElement>(null);
  const { width, height } = useElementSize(ref);
  return <div ref={ref}>{`${width}x${height}`}</div>;
}

describe("useElementSize", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("reports the element's laid out size from the first commit, without waiting for a ResizeObserver", () => {
    jest.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 320, height: 180 } as DOMRect);

    render(<Measured />);

    expect(screen.getByText("320x180")).toBeInTheDocument();
  });
});
