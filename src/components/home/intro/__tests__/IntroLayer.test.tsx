import { act, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { IntroLayer } from "@/components/home/intro/IntroLayer";
import { IntroReplayLink } from "@/components/home/intro/IntroReplayLink";
import messages from "../../../../../messages/en.json";

const draw = jest.fn();
jest.mock("@/components/home/intro/simulScene", () => ({ createScene: () => ({ resize: () => {}, draw }) }));

function homePage({ marked }: { marked: boolean }) {
  const gate = document.createElement("script");
  if (marked) gate.setAttribute("data-home-intro", "");
  document.body.append(gate);
  render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <button type="button">Play</button>
      <IntroReplayLink />
      <IntroLayer />
    </NextIntlClientProvider>,
  );
  return {
    gate,
    page: screen.getByRole("button", { name: "Play", hidden: true }),
    layer: screen.getByRole("region", { name: "The 45-board intro", hidden: true }),
    skip: screen.getByRole("button", { name: "Skip intro", hidden: true }),
    replay: screen.getByRole("button", { name: "Najdorf's 45 boards", hidden: true }),
  };
}

const shownCaption = (layer: HTMLElement) => layer.querySelector(".home-intro-caption[data-on]")?.textContent;
const advance = (ms: number) => act(() => jest.advanceTimersByTime(ms));

beforeEach(() => {
  jest.useFakeTimers({ now: 0 });
  draw.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
  window.localStorage.clear();
  document.body.innerHTML = "";
});

describe("the intro on a first visit", () => {
  it("plays, with Skip holding focus and the page under it inert", async () => {
    const { layer, page, skip } = homePage({ marked: true });
    await advance(100);
    expect(layer.dataset.phase).toBe("playing");
    expect(document.activeElement).toBe(skip);
    expect(page.hasAttribute("inert")).toBe(true);
    expect(shownCaption(layer)).toBe("One board. You can see it.Morphy's Opera Game, Paris, 1858. Every move is real.");
    expect(draw).toHaveBeenCalled();
  });

  it("moves through the captions and the counter on its own", async () => {
    const { layer } = homePage({ marked: true });
    await advance(3500);
    expect(shownCaption(layer)).toMatch(/^Now forty-five\./);
    expect(screen.getByText("24 boards")).toBeTruthy();
    await advance(2700);
    expect(shownCaption(layer)).toMatch(/^He saw none of them\./);
    expect(screen.getByText("45 boards · none seen")).toBeTruthy();
  });

  it("ends by itself after ten seconds and a fade, giving the page back", async () => {
    const { gate, layer, page } = homePage({ marked: true });
    await advance(10_100);
    expect(layer.dataset.phase).toBe("ending");
    await advance(400);
    expect(layer.dataset.phase).toBeUndefined();
    expect(gate.hasAttribute("data-home-intro")).toBe(false);
    expect(page.hasAttribute("inert")).toBe(false);
  });

  it("ends early on Skip or Escape", async () => {
    const { layer, skip } = homePage({ marked: true });
    await advance(100);
    fireEvent.click(skip);
    expect(layer.dataset.phase).toBe("ending");
    document.body.innerHTML = "";
    const second = homePage({ marked: true });
    await advance(100);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(second.layer.dataset.phase).toBe("ending");
  });

  it("jumps to the next beat on a tap, a jump key or a scroll", async () => {
    const { layer } = homePage({ marked: true });
    await advance(100);
    fireEvent.click(layer);
    await advance(32);
    expect(shownCaption(layer)).toMatch(/^Now forty-five\./);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    await advance(32);
    expect(shownCaption(layer)).toMatch(/^He saw none of them\./);
    fireEvent.wheel(layer, { deltaY: 120 });
    await advance(32);
    expect(shownCaption(layer)).toMatch(/^Start with one\./);
  });
});

describe("a swipe on a phone", () => {
  it("jumps to the next beat, while a touch that barely moves does not", async () => {
    const { layer } = homePage({ marked: true });
    await advance(100);
    fireEvent.touchStart(layer, { touches: [{ clientY: 500 }] });
    fireEvent.touchEnd(layer, { changedTouches: [{ clientY: 490 }] });
    await advance(32);
    expect(shownCaption(layer)).toMatch(/^One board\./);
    fireEvent.touchStart(layer, { touches: [{ clientY: 500 }] });
    fireEvent.touchEnd(layer, { changedTouches: [{ clientY: 380 }] });
    await advance(32);
    expect(shownCaption(layer)).toMatch(/^Now forty-five\./);
  });
});

describe("the hero's replay link", () => {
  it("leaves the intro alone until it is pressed", async () => {
    const { layer } = homePage({ marked: false });
    await advance(100);
    expect(layer.dataset.phase).toBeUndefined();
  });

  it("plays the intro again, then hands focus back to the link", async () => {
    const { layer, replay } = homePage({ marked: false });
    await advance(100);
    replay.focus();
    fireEvent.click(replay);
    await advance(100);
    expect(layer.dataset.phase).toBe("playing");
    expect(replay.hasAttribute("inert") || replay.closest("[inert]") !== null).toBe(true);
    fireEvent.keyDown(window, { key: "Escape" });
    await advance(400);
    expect(layer.dataset.phase).toBeUndefined();
    expect(document.activeElement).toBe(replay);
  });
});

describe("what the intro reports to analytics", () => {
  const events = () => (window.gtag as jest.Mock).mock.calls.map(([, name, params]) => [name, params]);

  beforeEach(() => {
    window.gtag = jest.fn();
  });

  afterEach(() => {
    Reflect.deleteProperty(window, "gtag");
  });

  it("reports a first-visit play that runs to the end", async () => {
    homePage({ marked: true });
    await advance(10_100);
    expect(events()).toEqual([
      ["home_intro_shown", {}],
      ["home_intro_completed", { play: "first" }],
    ]);
  });

  it("reports the beat a skip left, once", async () => {
    const { skip } = homePage({ marked: true });
    await advance(6000);
    fireEvent.click(skip);
    fireEvent.click(skip);
    await advance(400);
    expect(events()).toEqual([
      ["home_intro_shown", {}],
      ["home_intro_skipped", { beat: "dark", play: "first" }],
    ]);
  });

  it("reports a replay, and an Escape during it as a skip of the replay", async () => {
    const { replay } = homePage({ marked: false });
    await advance(100);
    fireEvent.click(replay);
    await advance(100);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(events()).toEqual([
      ["home_intro_replayed", {}],
      ["home_intro_skipped", { beat: "one", play: "replay" }],
    ]);
  });
});
