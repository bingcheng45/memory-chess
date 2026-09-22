const KEYS = {
  ArrowDown: { key: "ArrowDown", code: "ArrowDown", keyCode: 40 },
  ArrowUp: { key: "ArrowUp", code: "ArrowUp", keyCode: 38 },
  Enter: { key: "Enter", code: "Enter", keyCode: 13, text: String.fromCharCode(13) },
  Escape: { key: "Escape", code: "Escape", keyCode: 27 },
};

// The dialog animates in with a transform, so a rect read too early names a
// point the element has already moved away from. Wait until the centre of the
// rect actually hit-tests to the element before dispatching.
async function settledCentreOf(page, selector) {
  return page.waitFor(
    `(() => {
       const el = document.querySelector(${JSON.stringify(selector)});
       if (!el) return false;
       const r = el.getBoundingClientRect();
       if (r.width === 0 || r.height === 0) return false;
       const x = r.left + r.width / 2;
       const y = r.top + r.height / 2;
       const at = document.elementFromPoint(x, y);
       return at && (at === el || el.contains(at)) ? { x, y } : false;
     })()`,
  );
}

async function mouseClick(page, selector) {
  const { x, y } = await settledCentreOf(page, selector);
  for (const type of ["mousePressed", "mouseReleased"]) {
    await page.send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 });
  }
}

async function pressKey(page, name) {
  const { key, code, keyCode, text } = KEYS[name];
  const common = { key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode };
  await page.send("Input.dispatchKeyEvent", {
    type: text ? "keyDown" : "rawKeyDown",
    ...common,
    ...(text ? { text } : {}),
  });
  await page.send("Input.dispatchKeyEvent", { type: "keyUp", ...common });
}

const MEASURE_OPEN_LIST = `(() => {
  const list = document.querySelector('[role="listbox"]');
  if (!list) return { error: "no listbox open" };
  const popup = list.closest("[data-placement]");
  const dialog = document.querySelector('[role="dialog"]');
  const options = [...list.querySelectorAll('[role="option"]')];
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, height: r.height };
  };
  const hits = (el) => {
    const r = el.getBoundingClientRect();
    const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!at && (el === at || el.contains(at));
  };
  const first = options[0];
  list.scrollTop = 0;
  const firstVisible = hits(first);
  list.scrollTop = list.scrollHeight;
  const last = options[options.length - 1];
  const lastVisible = hits(last);
  return {
    placement: popup ? popup.getAttribute("data-placement") : null,
    popup: rect(popup),
    list: rect(list),
    dialog: dialog ? rect(dialog) : null,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    optionCount: options.length,
    scrollable: list.scrollHeight > list.clientHeight,
    firstOption: { id: first.id, visible: firstVisible },
    lastOption: { id: last.id, visible: lastVisible },
  };
})()`;

async function setViewport(page, width, height) {
  await page.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768,
  });
  await page.sleep(300);
}

async function assertPickerFits(page, label, expectedPlacement) {
  const standing = await page.eval(
    `(() => {
       const trigger = document.getElementById("player-country");
       if (!trigger) return { dialogOpen: !!document.querySelector('[role="dialog"]'), trigger: null };
       const r = trigger.getBoundingClientRect();
       const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
       return {
         dialogOpen: true,
         trigger: { top: Math.round(r.top), height: Math.round(r.height) },
         viewport: { width: window.innerWidth, height: window.innerHeight },
         covering: at ? at.id || at.tagName + "." + String(at.className).slice(0, 60) : null,
       };
     })()`,
  );
  if (!standing.trigger || standing.covering !== "player-country") {
    throw new Error(`${label}: the country trigger is not clickable (${JSON.stringify(standing)})`);
  }

  await mouseClick(page, "#player-country");
  await page.waitFor(`document.getElementById("player-country").getAttribute("aria-expanded") === "true"`);
  await page.waitFor(`!!document.querySelector('[role="listbox"]')`);

  const seen = await page.eval(MEASURE_OPEN_LIST);
  if (seen.error) throw new Error(`${label}: ${seen.error}`);

  const { popup, viewport, optionCount, scrollable, firstOption, lastOption, placement } = seen;
  const complaints = [];
  if (placement !== expectedPlacement) {
    complaints.push(`list opened ${placement} the trigger, expected ${expectedPlacement}`);
  }
  if (popup.top < 0) complaints.push(`popup top ${popup.top} is above the viewport`);
  if (popup.bottom > viewport.height + 1) {
    complaints.push(`popup bottom ${popup.bottom} is past the ${viewport.height}px fold`);
  }
  if (popup.left < 0) complaints.push(`popup left ${popup.left} is off the left edge`);
  if (popup.right > viewport.width + 1) {
    complaints.push(`popup right ${popup.right} is off the ${viewport.width}px right edge`);
  }
  if (optionCount !== 250) complaints.push(`list holds ${optionCount} options, expected 250`);
  if (!scrollable) complaints.push("list does not scroll, so most of it is unreachable");
  if (!firstOption.visible) complaints.push(`first option ${firstOption.id} is clipped or covered`);
  if (!lastOption.visible) {
    complaints.push(`last option ${lastOption.id} is clipped or covered after scrolling to the end`);
  }
  if (complaints.length > 0) {
    throw new Error(`${label}: ${complaints.join("; ")} -- ${JSON.stringify(seen)}`);
  }
  return seen;
}

async function playEasyRound(page, baseUrl) {
  await page.goto(`${baseUrl}/game`);
  await page.waitFor(
    `[...document.querySelectorAll("button")].some(b => b.textContent.includes("Start Training"))`,
  );
  await page.clickText("button", "Easy");
  await page.clickText("button", "Start Training");

  await page.waitFor(
    `[...document.querySelectorAll("button")].some(b => b.textContent.trim() === "Skip")`,
  );
  const pieces = await page.eval(
    `[...document.querySelectorAll("[data-coordinate]")]
       .map(el => ({ square: el.getAttribute("data-coordinate"), label: el.getAttribute("aria-label") || "" }))
       .filter(p => p.label.includes(" with "))`,
  );
  if (pieces.length === 0) throw new Error("memorization board shows no pieces");
  await page.clickText("button", "Skip");

  await page.waitFor(`!!document.querySelector('[aria-label="Select white pieces"]')`);
  for (const piece of pieces) {
    const name = piece.label.split(" with ")[1];
    const color = name.split(" ")[0];
    await page.click(`[aria-label="Select ${color} pieces"]`);
    await page.click(`[aria-label="Select ${name}"]`);
    await page.click(`[role="button"][data-coordinate="${piece.square}"]`);
  }
  await page.clickText("button", "Submit");
  await page.waitFor(`!!document.getElementById("game-result-heading")`, 20_000);
  return pieces.length;
}

export default async function drive(page, { baseUrl }) {
  const posted = [];
  await page.send("Network.enable");
  page.on((method, params) => {
    if (
      method === "Network.requestWillBeSent" &&
      params.request.method === "POST" &&
      params.request.url.includes("/api/leaderboard")
    ) {
      posted.push(params.request.postData);
    }
  });

  const pieceCount = await playEasyRound(page, baseUrl);

  // The first-game feedback prompt opens 800ms after the result screen and
  // stacks over anything else, so dismiss it before driving the dialog beneath.
  await page.sleep(1500);
  const feedbackShown = await page.eval(`!!document.getElementById("game-feedback")`);
  if (feedbackShown) {
    await pressKey(page, "Escape");
    await page.waitFor(`!document.getElementById("game-feedback")`);
  }

  await page.clickText("button", "Submit to Leaderboard");
  await page.waitFor(`!!document.getElementById("player-name")`);

  const fit = {};
  for (const [width, height, expected] of [
    [1280, 900, "below"],
    [375, 812, "below"],
    [375, 600, "below"],
    [375, 460, "above"],
  ]) {
    const label = `${width}x${height}`;
    await setViewport(page, width, height);
    fit[label] = await assertPickerFits(page, label, expected);
    await page.screenshot(`0-picker-open-${label}.png`);
    await pressKey(page, "Escape");
    await page.waitFor(`!document.querySelector('[role="listbox"]')`);
    await page.waitFor(`!!document.getElementById("player-name")`);
  }

  await setViewport(page, 375, 812);
  await mouseClick(page, "#player-name");
  await page.send("Input.insertText", { text: "Poteto" });
  await page.waitFor(`document.getElementById("player-name").value === "Poteto"`);

  await mouseClick(page, "#player-country");
  await page.waitFor(`document.getElementById("player-country").getAttribute("aria-expanded") === "true"`);
  await page.waitFor(`!!document.querySelector('[role="combobox"]')`);
  await page.send("Input.insertText", { text: "singa" });

  await page.waitFor(`document.querySelectorAll('[role="option"]').length === 1`);
  await page.screenshot("1-picker-open-375.png");

  const optionName = await page.eval(
    `document.querySelector('[role="option"]').textContent.trim()`,
  );
  await pressKey(page, "ArrowDown");
  await pressKey(page, "Enter");

  await page.waitFor(`document.querySelectorAll('[role="option"]').length === 0`);
  const triggerText = await page.eval(
    `document.getElementById("player-country").textContent.trim()`,
  );
  if (!triggerText.includes("Singapore")) {
    throw new Error(`trigger shows ${JSON.stringify(triggerText)} after picking Singapore`);
  }
  await page.screenshot("2-country-picked-375.png");

  await page.clickText("button", "Submit Score");

  const deadline = Date.now() + 15_000;
  while (posted.length === 0) {
    if (Date.now() > deadline) throw new Error("no POST to /api/leaderboard within 15s");
    await page.sleep(200);
  }

  const submitted = JSON.parse(posted[0]);
  if (submitted.country_code !== "SG") {
    throw new Error(`request body carried country_code ${JSON.stringify(submitted.country_code)}`);
  }
  if (submitted.player_name !== "Poteto") {
    throw new Error(`request body carried player_name ${JSON.stringify(submitted.player_name)}`);
  }
  await page.screenshot("3-after-submit-375.png");
  await page.send("Emulation.clearDeviceMetricsOverride");

  const remembered = await page.eval(
    `JSON.parse(localStorage.getItem("memory-chess-settings"))?.state?.countryCode ?? null`,
  );
  if (remembered !== "SG") {
    throw new Error(`settings store remembered ${JSON.stringify(remembered)}, not SG`);
  }

  return {
    pieceCount,
    optionName,
    requestBody: submitted,
    rememberedCountryCode: remembered,
    fit: Object.fromEntries(
      Object.entries(fit).map(([label, seen]) => [
        label,
        {
          placement: seen.placement,
          popupTop: Math.round(seen.popup.top),
          popupBottom: Math.round(seen.popup.bottom),
          viewportHeight: seen.viewport.height,
          listHeight: Math.round(seen.list.height),
          optionCount: seen.optionCount,
          lastOptionReachable: seen.lastOption.visible,
        },
      ]),
    ),
  };
}
