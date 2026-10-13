import { RECORD_HINT } from "@/components/home/recordHint";

function marksRecord(summary: string | null): boolean {
  if (summary !== null) window.localStorage.setItem("memory-chess-lab-summary", summary);
  const script = document.createElement("script");
  document.body.append(script);
  Object.defineProperty(document, "currentScript", { value: script, configurable: true });
  new Function(RECORD_HINT)();
  return script.hasAttribute("data-lab-record");
}

afterEach(() => {
  window.localStorage.clear();
  document.body.innerHTML = "";
});

describe("the record hint the home page runs before §06 paints", () => {
  it("marks a browser whose summary counts a round, so the panels reserve the record's room", () => {
    expect(marksRecord(JSON.stringify({ v: 4, rounds: 3 }))).toBe(true);
  });

  it.each([
    ["no summary", null],
    ["a summary of no rounds", JSON.stringify({ v: 4, rounds: 0 })],
    ["a summary that is not JSON", "{"],
  ])("leaves a browser with %s unmarked, so its Sample panels keep their own height", (_, summary) => {
    expect(marksRecord(summary)).toBe(false);
  });
});
