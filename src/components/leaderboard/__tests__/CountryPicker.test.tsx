import { useState } from "react";
import { fireEvent, render, screen } from "@/test-utils/intl";
import CountryPicker from "@/components/leaderboard/CountryPicker";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { WORLD_CODE, type CountryCode } from "@/lib/leaderboard/countries";

const SINGAPORE = "SG" as CountryCode;

interface HarnessProps {
  readonly initial: CountryCode;
  readonly onChange?: (code: CountryCode) => void;
}

function Harness({ initial, onChange }: HarnessProps) {
  const [value, setValue] = useState(initial);
  return (
    <CountryPicker
      id="country"
      value={value}
      onChange={(code) => {
        setValue(code);
        onChange?.(code);
      }}
    />
  );
}

const trigger = () => screen.getByRole("button");

const openPicker = () => {
  fireEvent.click(trigger());
  return screen.getByRole("combobox");
};

const search = (input: HTMLElement, text: string) => {
  fireEvent.change(input, { target: { value: text } });
};

describe("CountryPicker", () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it("shows World as the default selection", () => {
    render(<Harness initial={WORLD_CODE} />);
    expect(trigger()).toHaveTextContent("World");
  });

  it("filters to Singapore when the query matches the name", () => {
    render(<Harness initial={WORLD_CODE} />);

    search(openPicker(), "singa");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Singapore");
  });

  it("filters to Singapore when the query matches the country code", () => {
    render(<Harness initial={WORLD_CODE} />);

    search(openPicker(), "sg");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Singapore");
  });

  it("selects the active option on Enter and closes", () => {
    const onChange = jest.fn();
    render(<Harness initial={WORLD_CODE} onChange={onChange} />);

    const input = openPicker();
    search(input, "singa");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith("SG");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("walks the list with the arrow keys and wraps at both ends", () => {
    render(<Harness initial={WORLD_CODE} />);

    const input = openPicker();
    const codeOf = () => input.getAttribute("aria-activedescendant");
    const rendered = screen.getAllByRole("option");
    const first = rendered[0].id;
    const last = rendered[rendered.length - 1].id;

    expect(rendered).toHaveLength(250);
    expect(codeOf()).toBe(`country-option-${WORLD_CODE}`);
    expect(first).toBe(`country-option-${WORLD_CODE}`);

    fireEvent.keyDown(input, { key: "ArrowDown" });
    const second = codeOf();
    expect(second).not.toBe(first);

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(codeOf()).toBe(first);

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(codeOf()).toBe(last);

    fireEvent.keyDown(input, { key: "Home" });
    expect(codeOf()).toBe(first);

    fireEvent.keyDown(input, { key: "End" });
    expect(codeOf()).toBe(last);
  });

  it.each([
    ["turkiye", "TR"],
    ["cote d", "CI"],
    ["aland", "AX"],
    ["reunion", "RE"],
  ])("finds the country behind %s, typed without its diacritics", (typed, code) => {
    render(<Harness initial={WORLD_CODE} />);

    search(openPicker(), typed);

    const ids = screen.getAllByRole("option").map((option) => option.id);
    expect(ids).toContain(`country-option-${code}`);
  });

  it("selects the option the mouse presses", () => {
    const onChange = jest.fn();
    render(<Harness initial={WORLD_CODE} onChange={onChange} />);

    const input = openPicker();
    search(input, "singa");
    fireEvent.mouseDown(screen.getByRole("option", { name: /Singapore/ }));

    expect(onChange).toHaveBeenCalledWith("SG");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger()).toHaveTextContent("Singapore");
  });

  it("closes without selecting when a pointer lands outside it", () => {
    const onChange = jest.fn();
    render(
      <div>
        <Harness initial={WORLD_CODE} onChange={onChange} />
        <p data-testid="outside">elsewhere</p>
      </div>,
    );

    openPicker();
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.pointerDown(screen.getByTestId("outside"));

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("stays open when a pointer lands inside it", () => {
    render(<Harness initial={WORLD_CODE} />);

    const input = openPicker();
    fireEvent.pointerDown(input);

    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("says so when the query matches no country", () => {
    render(<Harness initial={WORLD_CODE} />);

    search(openPicker(), "qqqqq");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByText("No countries found")).toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the trigger", () => {
    render(<Harness initial={WORLD_CODE} />);

    const input = openPicker();
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.keyDown(input, { key: "Escape" });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
  });

  it("keeps Escape for the list, not for the dialog around it", () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Submit to Leaderboard</DialogTitle>
          <Harness initial={WORLD_CODE} />
        </DialogContent>
      </Dialog>,
    );

    fireEvent.click(screen.getByRole("button", { name: /World/ }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Escape" });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("preselects the current choice when reopened", () => {
    render(<Harness initial={SINGAPORE} />);
    expect(trigger()).toHaveTextContent("Singapore");

    expect(openPicker()).toHaveAttribute("aria-activedescendant", "country-option-SG");
  });

  it("reports its expanded state to assistive technology", () => {
    render(<Harness initial={WORLD_CODE} />);
    expect(trigger()).toHaveAttribute("aria-expanded", "false");

    openPicker();

    expect(trigger()).toHaveAttribute("aria-expanded", "true");
  });
});
