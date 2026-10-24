import { fireEvent, render, screen } from "@testing-library/react";
import { IntroSkip } from "@/components/home/intro/IntroSkip";

function markedGate(): HTMLScriptElement {
  const script = document.createElement("script");
  script.setAttribute("data-home-intro", "");
  document.body.append(script);
  return script;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("Skip", () => {
  it("ends the intro by removing the gate's mark", () => {
    const gate = markedGate();
    render(<IntroSkip label="Skip intro" />);
    fireEvent.click(screen.getByRole("button", { name: "Skip intro" }));
    expect(gate.hasAttribute("data-home-intro")).toBe(false);
  });

  it("ends it on Escape too", () => {
    const gate = markedGate();
    render(<IntroSkip label="Skip intro" />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(gate.hasAttribute("data-home-intro")).toBe(false);
  });

  it("leaves it playing on other keys", () => {
    const gate = markedGate();
    render(<IntroSkip label="Skip intro" />);
    fireEvent.keyDown(window, { key: "Enter" });
    expect(gate.hasAttribute("data-home-intro")).toBe(true);
  });
});
