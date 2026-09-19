import { act } from "react";
// @ts-expect-error react-dom ships no types for its node entry, which jsdom needs to avoid MessageChannel
import { renderToString } from "react-dom/server.node";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import GameConfig from "@/components/game/GameConfig";
import { GAME_STORAGE_KEY, gameConfigPrefillScript } from "@/lib/game/configPrefill";
import { useGameStore } from "@/lib/store/gameStore";
import messages from "../../../../messages/en.json";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const form = (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    <GameConfig />
  </NextIntlClientProvider>
);

const saved = (pieceCount: number, memorizeTime: number) =>
  JSON.stringify({ state: { lastSettings: { pieceCount, memorizeTime } }, version: 0 });

function formState(container: HTMLElement) {
  const buttons = [...container.querySelectorAll<HTMLButtonElement>("[data-preset]")];
  const slider = (id: string) => {
    const input = container.querySelector<HTMLInputElement>(`#${id}`)!;
    return {
      value: input.value,
      fill: input.style.getPropertyValue("--fill"),
      label: container.querySelector(`[data-value-for="${id}"]`)?.textContent,
    };
  };
  return {
    pressed: buttons.filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.dataset.preset),
    classes: buttons.map((b) => b.className),
    description: container.querySelector("[data-preset-description]")?.textContent,
    pieceCount: slider("pieceCount"),
    memorizeTime: slider("memorizeTime"),
  };
}

const mounted: Root[] = [];

function visit(url: string, stored: string | null) {
  window.history.pushState({}, "", url);
  localStorage.clear();
  if (stored !== null) localStorage.setItem(GAME_STORAGE_KEY, stored);
}

function serveWithPrefill() {
  const container = document.createElement("div");
  container.innerHTML = renderToString(form);
  document.body.appendChild(container);
  window.eval(gameConfigPrefillScript());
  return container;
}

async function hydrate(container: HTMLElement) {
  const recoverable: unknown[] = [];
  await useGameStore.persist.rehydrate();
  await act(async () => {
    mounted.push(hydrateRoot(container, form, { onRecoverableError: (error) => recoverable.push(error) }));
  });
  return recoverable;
}

async function clientRender() {
  await useGameStore.persist.rehydrate();
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  mounted.push(root);
  await act(async () => root.render(form));
  return container;
}

let consoleError: jest.SpyInstance;

beforeEach(() => {
  useGameStore.setState({ lastSettings: null });
  consoleError = jest.spyOn(console, "error");
});

afterEach(() => {
  act(() => mounted.splice(0).forEach((root) => root.unmount()));
  document.body.innerHTML = "";
  consoleError.mockRestore();
  window.history.pushState({}, "", "/");
  localStorage.clear();
});

const medium = { pressed: ["medium"], pieceCount: "6", memorizeTime: "10s" };

describe("GameConfig prefill script", () => {
  it.each([
    ["saved 3/18 shows Custom 3/18", "/game", saved(3, 18), { pressed: [], pieceCount: "3", memorizeTime: "18s" }],
    ["saved 12/8 shows Hard", "/game", saved(12, 8), { pressed: ["hard"], pieceCount: "12", memorizeTime: "8s" }],
    ["?difficulty=easy wins over saved 12/8", "/game?difficulty=easy", saved(12, 8), { pressed: ["easy"], pieceCount: "2", memorizeTime: "10s" }],
    ["?pieceCount= leaves Medium", "/game?pieceCount=5", saved(12, 8), medium],
    ["corrupted storage leaves Medium", "/game", "{not json", medium],
    ["out-of-range settings leave Medium", "/game", saved(40, 8), medium],
    ["no storage leaves Medium", "/game", null, medium],
  ])("%s, exactly as React renders it", async (_name, url, stored, expected) => {
    visit(url, stored);
    const served = formState(serveWithPrefill());

    expect({
      pressed: served.pressed,
      pieceCount: served.pieceCount.label,
      memorizeTime: served.memorizeTime.label,
    }).toEqual(expected);
    expect(served).toEqual(formState(await clientRender()));
  });

  it("describes the prefilled preset, or labels custom settings", () => {
    visit("/game", saved(12, 8));
    expect(formState(serveWithPrefill()).description).toBe("More pieces with less time to memorize");
    document.body.innerHTML = "";

    visit("/game", saved(3, 18));
    expect(formState(serveWithPrefill()).description).toBe("Custom settings");
  });

  it.each([
    ["saved 3/18", "/game", saved(3, 18)],
    ["saved 12/8", "/game", saved(12, 8)],
    ["?difficulty=easy", "/game?difficulty=easy", saved(12, 8)],
  ])("hydrates %s without a mismatch or a change", async (_name, url, stored) => {
    visit(url, stored);
    const container = serveWithPrefill();
    const served = formState(container);

    const recoverable = await hydrate(container);

    expect(recoverable).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
    expect(formState(container)).toEqual(served);
  });
});
