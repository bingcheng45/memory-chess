import { INTRO_GATE, INTRO_RULES, decideIntro, type IntroSignals } from "@/lib/home/intro/introGate";

const NONE: IntroSignals = { reducedMotion: false, saveData: false, seen: false, deepLink: false };

/** Runs the inline gate the way the page does, in a browser set up to give these signals. */
function runGate(signals: IntroSignals): { played: boolean; seen: string | null } {
  if (signals.seen) window.localStorage.setItem("memory-chess-home-intro-seen", "1");
  window.location.hash = signals.deepLink ? "#faq" : "";
  window.matchMedia = ((query: string) => ({ matches: signals.reducedMotion && query.includes("reduce") })) as typeof window.matchMedia;
  Object.defineProperty(navigator, "connection", { value: { saveData: signals.saveData }, configurable: true });
  const script = document.createElement("script");
  document.body.append(script);
  Object.defineProperty(document, "currentScript", { value: script, configurable: true });
  new Function(INTRO_GATE)();
  return { played: script.hasAttribute("data-home-intro"), seen: window.localStorage.getItem("memory-chess-home-intro-seen") };
}

afterEach(() => {
  window.localStorage.clear();
  document.body.innerHTML = "";
});

describe("decideIntro", () => {
  it("plays the intro for a first visit with no signal", () => {
    expect(decideIntro(NONE)).toBeNull();
  });

  it.each([
    ["reducedMotion", { reducedMotion: true }],
    ["saveData", { saveData: true }],
    ["seen", { seen: true }],
    ["deepLink", { deepLink: true }],
    ["reducedMotion", { reducedMotion: true, seen: true, deepLink: true }],
    ["seen", { seen: true, deepLink: true }],
  ])("stops it with the first matching rule, %s", (rule, signals) => {
    expect(decideIntro({ ...NONE, ...signals })).toBe(rule);
  });
});

describe("the inline gate", () => {
  const combinations = Array.from({ length: 2 ** INTRO_RULES.length }, (_, bits) =>
    Object.fromEntries(INTRO_RULES.map((signal, index) => [signal, Boolean(bits & (1 << index))])) as IntroSignals,
  );

  it.each(combinations.map((signals) => [JSON.stringify(signals), signals] as const))(
    "agrees with decideIntro for %s",
    (_, signals) => {
      expect(runGate(signals).played).toBe(decideIntro(signals) === null);
    },
  );

  it("records the visit when it plays, so the next visit skips", () => {
    expect(runGate(NONE)).toEqual({ played: true, seen: "1" });
    expect(runGate(NONE).played).toBe(false);
  });

  it("writes nothing for a visitor it skips", () => {
    expect(runGate({ ...NONE, deepLink: true })).toEqual({ played: false, seen: null });
  });

  it("plays nothing when storage throws", () => {
    const getItem = jest.spyOn(Storage.prototype, "getItem").mockImplementationOnce(() => {
      throw new Error("blocked");
    });
    expect(runGate(NONE).played).toBe(false);
    getItem.mockRestore();
  });
});
