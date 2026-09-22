const KEYS = {
  ArrowDown: { key: "ArrowDown", code: "ArrowDown", keyCode: 40 },
  Enter: { key: "Enter", code: "Enter", keyCode: 13, text: String.fromCharCode(13) },
  Escape: { key: "Escape", code: "Escape", keyCode: 27 },
};

// The dialog animates in with a transform, so a rect read too early names a
// point the element has already moved away from.
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
  const exchanges = new Map();
  await page.send("Network.enable");
  page.on((method, params) => {
    if (
      method === "Network.requestWillBeSent" &&
      params.request.method === "POST" &&
      params.request.url.includes("/api/leaderboard")
    ) {
      exchanges.set(params.requestId, { postData: params.request.postData });
    }
    if (method === "Network.responseReceived" && exchanges.has(params.requestId)) {
      exchanges.get(params.requestId).status = params.response.status;
    }
  });

  const pieceCount = await playEasyRound(page, baseUrl);

  // The first-game feedback prompt opens 800ms after the result screen and
  // stacks over anything else, so dismiss it before driving the dialog beneath.
  await page.sleep(1500);
  if (await page.eval(`!!document.getElementById("game-feedback")`)) {
    await pressKey(page, "Escape");
    await page.waitFor(`!document.getElementById("game-feedback")`);
  }

  await page.clickText("button", "Submit to Leaderboard");
  await page.waitFor(`!!document.getElementById("player-name")`);

  await mouseClick(page, "#player-name");
  await page.send("Input.insertText", { text: "Poteto" });
  await page.waitFor(`document.getElementById("player-name").value === "Poteto"`);

  await mouseClick(page, "#player-country");
  await page.waitFor(`document.getElementById("player-country").getAttribute("aria-expanded") === "true"`);
  await page.waitFor(`!!document.querySelector('[role="combobox"]')`);
  await page.send("Input.insertText", { text: "singa" });
  await page.waitFor(`document.querySelectorAll('[role="option"]').length === 1`);
  await pressKey(page, "ArrowDown");
  await pressKey(page, "Enter");
  await page.waitFor(`document.querySelectorAll('[role="option"]').length === 0`);

  const triggerText = await page.eval(
    `document.getElementById("player-country").textContent.trim()`,
  );
  if (!triggerText.includes("Singapore")) {
    throw new Error(`trigger shows ${JSON.stringify(triggerText)} after picking Singapore`);
  }
  await page.screenshot("1-country-picked.png");

  await page.clickText("button", "Submit Score");

  const deadline = Date.now() + 20_000;
  await page.waitFor(
    `(() => {
       const dialog = document.querySelector('[role="dialog"]');
       if (!dialog) return false;
       const text = dialog.innerText;
       return text.includes("Error:") || text.includes("Score Submitted");
     })()`,
    20_000,
  );
  while ([...exchanges.values()].every((exchange) => exchange.status === undefined)) {
    if (Date.now() > deadline) throw new Error("no response to a POST on /api/leaderboard");
    await page.sleep(200);
  }
  await page.screenshot("2-dialog-after-submit.png");

  const dialogText = await page.eval(
    `document.querySelector('[role="dialog"]').innerText.replace(/\\n+/g, " | ")`,
  );
  const [exchange] = [...exchanges.values()];

  return {
    pieceCount,
    requestBody: JSON.parse(exchange.postData),
    responseStatus: exchange.status,
    dialogText,
    succeeded: dialogText.includes("Score Submitted"),
  };
}
