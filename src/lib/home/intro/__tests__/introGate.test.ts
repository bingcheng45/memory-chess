import { FIRST_SCREEN_MEDIA, INTRO_GATE, INTRO_RULES, decideIntro, type IntroSignals } from "@/lib/home/intro/introGate";

const NONE: IntroSignals = { reducedMotion: false, saveData: false, seen: false, deepLink: false, firstScreen: false };

/**
 * Runs the inline gate the way the page does, in a browser set up to give these signals. firstScreen is a phone
 * (FIRST_SCREEN_MEDIA matches) on a page in `lang`, English unless a test says otherwise; without it the page is on a
 * desktop, so the locale alone never stops the intro.
 */
function runGate(signals: IntroSignals, lang = "en"): { played: boolean; seen: string | null } {
  if (signals.seen) window.localStorage.setItem("memory-chess-home-intro-seen", "1");
  window.location.hash = signals.deepLink ? "#faq" : "";
  document.documentElement.lang = lang;
  window.matchMedia = ((query: string) => ({
    matches: query.includes("reduce") ? signals.reducedMotion : query === FIRST_SCREEN_MEDIA && signals.firstScreen,
  })) as typeof window.matchMedia;
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
    ["firstScreen", { firstScreen: true }],
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

  it("still plays for a phone whose page is not in a first-screen language", () => {
    expect(runGate({ ...NONE, firstScreen: true }, "de")).toEqual({ played: true, seen: "1" });
  });

  it("skips a phone whose page is in a first-screen language", () => {
    expect(runGate({ ...NONE, firstScreen: true }, "en")).toEqual({ played: false, seen: null });
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
