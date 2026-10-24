import { act, fireEvent, render, screen } from "@testing-library/react";
import { IntroSkip } from "@/components/home/intro/IntroSkip";

function introPage({ marked }: { marked: boolean }) {
  const gate = document.createElement("script");
  if (marked) gate.setAttribute("data-home-intro", "");
  document.body.append(gate);
  render(
    <>
      <button type="button">Play</button>
      <section className="home-intro">
        <IntroSkip label="Skip intro" />
      </section>
    </>,
  );
  return { gate, page: screen.getByRole("button", { name: "Play", hidden: true }), skip: screen.getByRole("button", { name: "Skip intro" }) };
}

afterEach(() => {
  jest.useRealTimers();
  document.body.innerHTML = "";
});

describe("Skip", () => {
  it("takes focus and makes the covered page inert while the intro plays", () => {
    const { page, skip } = introPage({ marked: true });
    expect(document.activeElement).toBe(skip);
    expect(page.hasAttribute("inert")).toBe(true);
  });

  it("ends the intro on click, giving the page back", () => {
    const { gate, page, skip } = introPage({ marked: true });
    fireEvent.click(skip);
    expect(gate.hasAttribute("data-home-intro")).toBe(false);
    expect(page.hasAttribute("inert")).toBe(false);
  });

  it("ends it on Escape too", () => {
    const { gate, page } = introPage({ marked: true });
    fireEvent.keyDown(window, { key: "Escape" });
    expect(gate.hasAttribute("data-home-intro")).toBe(false);
    expect(page.hasAttribute("inert")).toBe(false);
  });

  it("leaves it playing on other keys", () => {
    const { gate } = introPage({ marked: true });
    fireEvent.keyDown(window, { key: "Enter" });
    expect(gate.hasAttribute("data-home-intro")).toBe(true);
  });

  it("gives the page back at the 12 second failsafe", () => {
    jest.useFakeTimers({ now: 0 });
    const { gate, page } = introPage({ marked: true });
    act(() => jest.advanceTimersByTime(11_999));
    expect(page.hasAttribute("inert")).toBe(true);
    act(() => jest.advanceTimersByTime(1));
    expect(gate.hasAttribute("data-home-intro")).toBe(false);
    expect(page.hasAttribute("inert")).toBe(false);
  });

  it("touches nothing when the gate skipped the intro", () => {
    const { page, skip } = introPage({ marked: false });
    expect(document.activeElement).not.toBe(skip);
    expect(page.hasAttribute("inert")).toBe(false);
  });
});
