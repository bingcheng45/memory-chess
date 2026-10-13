import { act } from "react";
// @ts-expect-error react-dom ships no types for its node entry, which jsdom needs to avoid MessageChannel
import { renderToString } from "react-dom/server.node";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import { CoordinatesSwitch } from "@/components/settings/CoordinatesSwitch";
import { coordinatesPrefillScript, SETTINGS_STORAGE_KEY } from "@/lib/settings/coordinatesPrefill";
import { useSettingsStore } from "@/stores/settingsStore";
import messages from "../../../../messages/en.json";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const field = (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    <CoordinatesSwitch />
  </NextIntlClientProvider>
);

const switchState = (container: HTMLElement) => {
  const button = container.querySelector('[role="switch"]') as HTMLElement;
  return { checked: button.getAttribute("aria-checked"), text: button.textContent };
};

const mounted: Root[] = [];

/** The switch as the server sends it, which knows no player and draws the default, then the inline script over it. */
function serveWithPrefill(stored: string | null) {
  // Set first: the store writes itself to storage on every change.
  useSettingsStore.setState({ showCoordinates: true });
  localStorage.clear();
  if (stored !== null) localStorage.setItem(SETTINGS_STORAGE_KEY, stored);
  const container = document.createElement("div");
  container.innerHTML = renderToString(field);
  document.body.appendChild(container);
  window.eval(coordinatesPrefillScript());
  return container;
}

async function clientRender() {
  await useSettingsStore.persist.rehydrate();
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  mounted.push(root);
  await act(async () => root.render(field));
  return container;
}

afterEach(() => {
  act(() => mounted.splice(0).forEach((root) => root.unmount()));
  document.body.innerHTML = "";
  localStorage.clear();
});

const v2 = (showCoordinates: unknown) => JSON.stringify({ state: { showCoordinates, countryCode: "WW" }, version: 2 });
const v1 = (showCoordinates: unknown) => JSON.stringify({ state: { showCoordinates }, version: 1 });

describe("coordinates switch prefill script", () => {
  it.each([
    ["turned off", v2(false), { checked: "false", text: "Off" }],
    ["turned on", v2(true), { checked: "true", text: "On" }],
    ["never set", null, { checked: "true", text: "On" }],
    ["stored null before v2", v1(null), { checked: "true", text: "On" }],
    ["turned off before v2", v1(false), { checked: "false", text: "Off" }],
    ["corrupted", "{not json", { checked: "true", text: "On" }],
  ])("paints %s first, exactly as the client then renders it", async (_name, stored, expected) => {
    const served = switchState(serveWithPrefill(stored));
    document.body.innerHTML = "";

    expect(served).toEqual(expected);
    expect(switchState(await clientRender())).toEqual(served);
  });

  it("hydrates a turned-off switch without a mismatch or a change", async () => {
    const consoleError = jest.spyOn(console, "error");
    const container = serveWithPrefill(v2(false));
    const served = container.querySelector('[role="switch"]');
    const recoverable: unknown[] = [];

    await useSettingsStore.persist.rehydrate();
    await act(async () => {
      mounted.push(hydrateRoot(container, field, { onRecoverableError: (error) => recoverable.push(error) }));
    });

    expect(recoverable).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
    expect(container.querySelector('[role="switch"]')).toBe(served);
    expect(switchState(container)).toEqual({ checked: "false", text: "Off" });
    consoleError.mockRestore();
  });
});
