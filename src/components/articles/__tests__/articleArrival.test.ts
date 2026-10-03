import { announceArrival, clearArrival, peekArrival } from "@/components/articles/articleArrival";

afterEach(() => {
  clearArrival();
});

describe("articleArrival", () => {
  it("holds nothing until a link announces an arrival", () => {
    expect(peekArrival("alder-fixture")).toBeNull();
  });

  it("answers only the announced slug, with the promise that says when typing may start", () => {
    const flight = new Promise<void>(() => {});
    announceArrival("alder-fixture", flight);

    expect(peekArrival("birch-fixture")).toBeNull();
    expect(peekArrival("alder-fixture")?.mayStart).toBe(flight);
  });

  it("reads without clearing, so a render that runs twice sees the same answer", () => {
    announceArrival("alder-fixture", Promise.resolve());

    expect(peekArrival("alder-fixture")).not.toBeNull();
    expect(peekArrival("alder-fixture")).toBe(peekArrival("alder-fixture"));
  });

  it("is gone after one clear, and a second clear changes nothing", () => {
    announceArrival("alder-fixture", Promise.resolve());

    clearArrival();
    clearArrival();

    expect(peekArrival("alder-fixture")).toBeNull();
  });

  it("keeps only the latest announcement", () => {
    announceArrival("alder-fixture", Promise.resolve());
    announceArrival("birch-fixture", Promise.resolve());

    expect(peekArrival("alder-fixture")).toBeNull();
    expect(peekArrival("birch-fixture")).not.toBeNull();
  });
});
