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
  const preview = container.querySelector<HTMLElement>("[data-setup-preview]")!;
  return {
    pressed: buttons.filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.dataset.preset),
    classes: buttons.map((b) => b.className),
    description: container.querySelector("[data-preset-description]")?.textContent,
    pieceCount: container.querySelector("output#pieceCount")?.textContent,
    memorizeTime: container.querySelector("output#memorizeTime")?.textContent,
    stepsUnavailable: [...container.querySelectorAll("[data-stepper]")].map((b) => b.getAttribute("aria-disabled")),
    board: {
      label: preview.getAttribute("aria-label"),
      count: preview.style.getPropertyValue("--count"),
      study: preview.style.getPropertyValue("--study"),
    },
    summary: container.querySelector("[data-preview-summary] [data-template]")?.textContent,
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
    ["saved 32/1 shows Custom 32/1", "/game", saved(32, 1), { pressed: [], pieceCount: "32", memorizeTime: "1s" }],
    ["saved 12/8 shows Hard", "/game", saved(12, 8), { pressed: ["hard"], pieceCount: "12", memorizeTime: "8s" }],
    ["?difficulty=easy wins over saved 12/8", "/game?difficulty=easy", saved(12, 8), { pressed: ["easy"], pieceCount: "2", memorizeTime: "10s" }],
    ["?pieceCount= leaves Medium", "/game?pieceCount=5", saved(12, 8), medium],
    ["corrupted storage leaves Medium", "/game", "{not json", medium],
    ["out-of-range settings leave Medium", "/game", saved(40, 8), medium],
    ["no storage leaves Medium", "/game", null, medium],
  ])("%s, exactly as React renders it", async (_name, url, stored, expected) => {
    visit(url, stored);
    const served = formState(serveWithPrefill());
    document.body.innerHTML = "";

    expect({
      pressed: served.pressed,
      pieceCount: served.pieceCount,
      memorizeTime: served.memorizeTime,
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
  ])("hydrates %s onto the served form without a mismatch or a change", async (_name, url, stored) => {
    visit(url, stored);
    const container = serveWithPrefill();
    const served = formState(container);
    const servedForm = container.firstElementChild;

    const recoverable = await hydrate(container);

    expect(recoverable).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
    expect(container.firstElementChild).toBe(servedForm);
    expect(formState(container)).toEqual(served);
    expect(container.querySelector("[data-prefilled]")).toBeNull();
  });

  it("paints a prefilled 2/60 with the ends unavailable, the kings alone and the ring full", () => {
    visit("/game", saved(2, 60));

    expect(formState(serveWithPrefill())).toMatchObject({
      pressed: [],
      pieceCount: "2",
      memorizeTime: "60s",
      stepsUnavailable: ["true", "false", "false", "true"],
      board: { label: "Board preview. Pieces on the board: 2", count: "2", study: "100%" },
      summary: "Custom settings, 2 pcs / 60s",
    });
  });

  it("never writes the served Medium values back to the controls while hydrating a prefilled 3/18", async () => {
    visit("/game", saved(3, 18));
    const container = serveWithPrefill();
    const watched = container.querySelectorAll("[data-preset], [data-preset-description], output, [data-stepper], [data-setup-preview]");
    const observer = new MutationObserver(() => {});
    watched.forEach((element) => observer.observe(element, { attributes: true, childList: true, characterData: true, subtree: true }));

    await hydrate(container);
    const mutations = observer.takeRecords();
    observer.disconnect();

    expect(mutations.map((mutation) => `${mutation.type} ${mutation.attributeName ?? ""}`)).toEqual([]);
    expect(formState(container).pieceCount).toBe("3");
  });

  it("follows the store when it settles somewhere else than the prefill", async () => {
    visit("/game", saved(12, 8));
    const container = serveWithPrefill();
    localStorage.clear();

    const recoverable = await hydrate(container);

    expect(recoverable).toEqual([]);
    expect(formState(container).pressed).toEqual(["medium"]);
    expect(formState(container)).toEqual(formState(await clientRender()));
    expect(container.querySelector("[data-prefilled]")).toBeNull();
  });
});
