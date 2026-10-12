// Drives the hub's question search through real key events at 1440 and 390 wide: the index loads only on focus,
// "/" focuses the field, results float without moving the h1, arrows set the active option, and a query with no
// match shows the no-result state. Run through cdp.mjs.
const WIDTHS = [
  { name: "1440", width: 1440, height: 900, mobile: false },
  { name: "390", width: 390, height: 844, mobile: true },
];

const key = (page, k, code = k) =>
  page.send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code, text: k.length === 1 ? k : undefined }).then(() =>
    page.send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code }),
  );

export default async function drive(page, { baseUrl }) {
  const indexRequests = [];
  await page.send("Network.enable");
  page.on((method, params) => {
    if (method === "Network.requestWillBeSent" && params.request.url.includes("/api/learn/search-index")) {
      indexRequests.push(params.request.url);
    }
  });

  const report = {};
  for (const size of WIDTHS) {
    await page.send("Emulation.setDeviceMetricsOverride", { width: size.width, height: size.height, deviceScaleFactor: 1, mobile: size.mobile });
    indexRequests.length = 0;
    await page.goto(`${baseUrl}/learn`);
    await page.sleep(500);
    const requestsBeforeFocus = indexRequests.length;
    const h1Before = await page.eval(`document.querySelector("h1").getBoundingClientRect().top`);

    await key(page, "/", "Slash");
    const focused = await page.eval(`document.activeElement?.getAttribute("role")`);
    await page.waitFor(`performance.getEntriesByName(location.origin + "/api/learn/search-index").length > 0`, 5000);
    await page.send("Input.insertText", { text: "why do i keep hanging pieces" });
    await page.waitFor(`document.querySelectorAll('[role="option"]').length > 0`, 5000);
    await key(page, "ArrowDown");
    const state = await page.eval(`(() => {
      const field = document.querySelector('[role="combobox"]');
      const active = document.getElementById(field.getAttribute("aria-activedescendant") ?? "");
      return {
        expanded: field.getAttribute("aria-expanded"),
        options: [...document.querySelectorAll('[role="option"]')].map((o) => o.getAttribute("href")),
        active: active?.getAttribute("href") ?? null,
        h1Top: document.querySelector("h1").getBoundingClientRect().top,
        overflow: document.documentElement.scrollWidth - window.innerWidth,
      };
    })()`);
    await page.sleep(300);
    await page.screenshot(`search-${size.name}-results.png`);

    await key(page, "Escape");
    await page.send("Input.insertText", { text: "xyzzy" });
    await page.waitFor(`document.querySelector(".ls-none") !== null`, 5000);
    const none = await page.eval(`document.querySelector(".ls-none p").textContent`);
    await page.sleep(300);
    await page.screenshot(`search-${size.name}-none.png`);
    await page.sleep(1200);
    const status = await page.eval(`document.querySelector('[role="status"]').textContent`);

    const result = { requestsBeforeFocus, focused, ...state, h1Moved: state.h1Top - h1Before, none, status };
    report[size.name] = result;
    if (requestsBeforeFocus !== 0) throw new Error(`${size.name}: index loaded before focus`);
    if (focused !== "combobox") throw new Error(`${size.name}: "/" did not focus the field`);
    if (result.h1Moved !== 0) throw new Error(`${size.name}: h1 moved by ${result.h1Moved}px`);
    if (state.overflow > 0) throw new Error(`${size.name}: overflow ${state.overflow}px`);
    if (state.active !== state.options[0]) throw new Error(`${size.name}: ArrowDown did not activate the first option`);
  }
  return report;
}
