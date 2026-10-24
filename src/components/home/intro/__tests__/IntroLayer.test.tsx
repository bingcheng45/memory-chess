import { act, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { IntroLayer } from "@/components/home/intro/IntroLayer";
import messages from "../../../../../messages/en.json";

const draw = jest.fn();
jest.mock("@/components/home/intro/simulScene", () => ({ createScene: () => ({ resize: () => {}, draw }) }));

function homePage({ marked, seen = false }: { marked: boolean; seen?: boolean }) {
  if (seen) window.localStorage.setItem("memory-chess-home-intro-seen", "1");
  const gate = document.createElement("script");
  if (marked) gate.setAttribute("data-home-intro", "");
  document.body.append(gate);
  render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <button type="button">Play</button>
      <IntroLayer />
    </NextIntlClientProvider>,
  );
  return {
    gate,
    page: screen.getByRole("button", { name: "Play", hidden: true }),
    layer: screen.getByRole("region", { name: "The 45-board intro", hidden: true }),
    skip: screen.getByRole("button", { name: "Skip intro", hidden: true }),
    replay: document.querySelector<HTMLButtonElement>(".home-intro-replay")!,
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

  it("ends by itself after ten seconds and a fade, giving the page back and offering a replay", async () => {
    const { gate, layer, page, replay } = homePage({ marked: true });
    await advance(10_100);
    expect(layer.dataset.phase).toBe("ending");
    await advance(400);
    expect(layer.dataset.phase).toBeUndefined();
    expect(gate.hasAttribute("data-home-intro")).toBe(false);
    expect(page.hasAttribute("inert")).toBe(false);
    expect(replay.hidden).toBe(false);
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

describe("the replay chip", () => {
  it("stays away on a first visit the gate skipped", async () => {
    const { layer, replay } = homePage({ marked: false });
    await advance(100);
    expect(layer.dataset.phase).toBeUndefined();
    expect(replay.hidden).toBe(true);
  });

  it("plays the intro again for a visitor who has seen it, then hands focus back to the chip", async () => {
    const { layer, replay } = homePage({ marked: false, seen: true });
    await advance(100);
    expect(replay.hidden).toBe(false);
    fireEvent.click(replay);
    await advance(100);
    expect(layer.dataset.phase).toBe("playing");
    expect(replay.hidden).toBe(true);
    fireEvent.keyDown(window, { key: "Escape" });
    await advance(400);
    expect(layer.dataset.phase).toBeUndefined();
    expect(document.activeElement).toBe(replay);
  });
});
