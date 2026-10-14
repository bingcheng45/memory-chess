import { render, screen } from "@testing-library/react";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

function Broken(): never {
  throw new Error("Loading chunk failed");
}

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

it("draws nothing when the fallback is null", () => {
  const { container } = render(
    <ErrorBoundary fallback={null}>
      <Broken />
    </ErrorBoundary>,
  );

  expect(container).toBeEmptyDOMElement();
});

it("draws the given fallback in place of the children", () => {
  render(
    <ErrorBoundary fallback={<p>Board unavailable</p>}>
      <Broken />
    </ErrorBoundary>,
  );

  expect(screen.getByText("Board unavailable")).toBeInTheDocument();
});
