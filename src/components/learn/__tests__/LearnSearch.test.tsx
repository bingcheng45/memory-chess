import { act, fireEvent, render, screen, within } from "@testing-library/react";
import LearnSearch from "@/components/learn/LearnSearch";
import { learnSearchDocs } from "@/lib/seo/learn/searchDocs";

const STAGES = [
  { id: "foundations", label: "Start here" },
  { id: "practice", label: "Practice and review" },
];

const gtag = jest.fn();

beforeEach(() => {
  jest.useFakeTimers();
  gtag.mockReset();
  window.gtag = gtag;
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => learnSearchDocs({ withBody: false }) }) as jest.Mock;
});

afterEach(() => {
  jest.useRealTimers();
  // @ts-expect-error gtag is optional at runtime
  delete window.gtag;
});

async function open() {
  render(<LearnSearch stages={STAGES} />);
  const field = screen.getByRole("combobox", { name: "Ask a question" });
  await act(async () => {
    fireEvent.focus(field);
  });
  return field;
}

function type(field: HTMLElement, value: string) {
  fireEvent.change(field, { target: { value } });
}

describe("LearnSearch", () => {
  it("ranks guides as the reader types, in a listbox the field controls", async () => {
    const field = await open();
    type(field, "why do i keep hanging pieces");

    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(field).toHaveAttribute("aria-expanded", "true");
    expect(options.map((option) => option.getAttribute("href"))).toEqual([
      "/learn/how-to-stop-blundering-in-chess",
      "/learn/how-to-get-better-at-chess-for-beginners",
    ]);
    expect(options[0].textContent).toBe("How to Stop Blundering in ChessBoard vision and blundersAnswers: How do I stop blundering pieces?");
    expect([...options[0].querySelectorAll("mark")].map((mark) => mark.textContent?.trim())).toEqual(["blundering", "pieces?"]);
    expect(screen.getByText("Results")).toBeInTheDocument();
  });

  it("moves through results with the arrows and back to the field past the last one", async () => {
    const field = await open();
    type(field, "why do i keep hanging pieces");
    const [first, second] = screen.getAllByRole("option");

    fireEvent.keyDown(field, { key: "ArrowDown" });
    expect(field).toHaveAttribute("aria-activedescendant", first.id);
    fireEvent.keyDown(field, { key: "ArrowDown" });
    expect(field).toHaveAttribute("aria-activedescendant", second.id);
    fireEvent.keyDown(field, { key: "ArrowDown" });
    expect(field).not.toHaveAttribute("aria-activedescendant");
    fireEvent.keyDown(field, { key: "ArrowUp" });
    expect(field).toHaveAttribute("aria-activedescendant", second.id);
  });

  it("labels a loose match as the closest guides", async () => {
    const field = await open();
    type(field, "elo stuck");

    expect(screen.getByText("Closest guides")).toBeInTheDocument();
  });

  it("says when no guide answers and offers the stages and a round", async () => {
    const field = await open();
    type(field, "xyzzy");

    expect(screen.getByText('No guide answers "xyzzy" yet.')).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Practice and review" })).toHaveAttribute("href", "#practice");
    expect(screen.getByRole("link", { name: "Play a 6-piece round" })).toHaveAttribute(
      "href",
      "/game?pieceCount=6&memorizeTime=10&from=guide_cta",
    );
  });

  it("announces the count once typing pauses and reports the length, never the words", async () => {
    const field = await open();
    type(field, "knight fork");
    const status = screen.getByRole("status");

    expect(status.textContent).toBe("");
    act(() => jest.advanceTimersByTime(400));
    expect(status.textContent).toBe("1 guide matches");
    act(() => jest.advanceTimersByTime(600));
    expect(gtag).toHaveBeenCalledWith("event", "learn_search", {
      query_length: 11,
      results: 1,
      top: "chess-pattern-recognition-drills",
      outcome: "strong",
      surface: "hub",
    });
  });

  it("clears on the first Escape and hands focus back on the second", async () => {
    const before = document.createElement("button");
    document.body.append(before);
    before.focus();
    render(<LearnSearch stages={STAGES} />);
    const field = screen.getByRole("combobox");

    await act(async () => {
      fireEvent.keyDown(before, { key: "/" });
    });
    expect(document.activeElement).toBe(field);
    type(field, "blunder");
    fireEvent.keyDown(field, { key: "Escape" });
    expect(field).toHaveValue("");
    fireEvent.keyDown(field, { key: "Escape" });
    expect(document.activeElement).toBe(before);
    before.remove();
  });

  it("submits to the server search as a plain form", () => {
    render(<LearnSearch stages={STAGES} />);
    const form = screen.getByRole("search");

    expect(form).toHaveAttribute("action", "/learn/search");
    expect(form).toHaveAttribute("method", "get");
    expect(within(form).getByRole("combobox")).toHaveAttribute("name", "q");
  });
});
