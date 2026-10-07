import { renderWithIntl, screen, within } from "@/test-utils/intl";
import { MicroscopeSection } from "@/components/home/MicroscopeSection";

describe("MicroscopeSection", () => {
  it("walks the five phases of a round in order", () => {
    renderWithIntl(<MicroscopeSection />);

    const titles = screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
    expect(titles).toEqual([
      "Look for how pieces relate.",
      "Eight pieces become three groups.",
      "The board clears.",
      "Rebuild one group at a time.",
      "Read the result. Run it again.",
    ]);
  });

  it("numbers the steps from the phase table, with Rebuild as phase 04", () => {
    renderWithIntl(<MicroscopeSection />);

    const labels = screen.getAllByText(/^Phase 0\d \/ /).map((label) => label.textContent);
    // The sticky figure repeats the current step's label above the step list.
    expect(labels.slice(1)).toEqual([
      "Phase 01 / Study",
      "Phase 02 / Chunk",
      "Phase 03 / Blank",
      "Phase 04 / Rebuild",
      "Phase 05 / Score",
    ]);
  });

  it("no longer claims what the figure does not show", () => {
    const { container } = renderWithIntl(<MicroscopeSection />);

    expect(container).not.toHaveTextContent("loudest features");
    expect(container).not.toHaveTextContent("square by square");
    expect(container).not.toHaveTextContent("under tension");
    expect(container).not.toHaveTextContent("outside a clean chunk");
  });

  it("labels the three groups and joins related pieces with five dashed lines", () => {
    const { container } = renderWithIntl(<MicroscopeSection />);
    const figure = container.querySelector<HTMLElement>(".lab-scope-fig")!;

    expect(within(figure).getByText("A · Corner ×5")).toBeInTheDocument();
    expect(within(figure).getByText("B · File pair ×2")).toBeInTheDocument();
    expect(within(figure).getByText("C · Lone ×1")).toBeInTheDocument();
    expect(figure.querySelectorAll("line")).toHaveLength(5);
  });
});
