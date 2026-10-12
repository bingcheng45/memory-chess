const ESCAPE = { key: "Escape", code: "Escape", windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 };
const difficulty = process.env.SUBMIT_DIFFICULTY ?? "Medium";
const names = (process.env.SUBMIT_NAMES ?? "Rater one").split(",");
const shotPrefix = process.env.SUBMIT_SHOT ?? "submit";

async function centreOf(page, selector) {
  return page.waitFor(
    `(() => {
       const el = document.querySelector(${JSON.stringify(selector)});
       if (!el) return false;
       const r = el.getBoundingClientRect();
       if (r.width === 0 || r.height === 0) return false;
       const x = r.left + r.width / 2, y = r.top + r.height / 2;
       const at = document.elementFromPoint(x, y);
       return at && (at === el || el.contains(at)) ? { x, y } : false;
     })()`,
  );
}

async function mouseClick(page, selector) {
  const { x, y } = await centreOf(page, selector);
  for (const type of ["mousePressed", "mouseReleased"]) {
    await page.send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 });
  }
}

const phaseIs = (phase) => `document.querySelector("[data-round-phase]")?.dataset.roundPhase === "${phase}"`;

async function wordsOf() {
  const { readFileSync } = await import("node:fs");
  const { game } = JSON.parse(readFileSync(new URL("../../../../messages/en.json", import.meta.url), "utf8"));
  return { start: game.config.start, preset: game.presets[difficulty.toLowerCase()].label, round: game.round };
}

async function playRound(page, baseUrl) {
  const words = await wordsOf();
  const cells = `[...document.querySelectorAll("[data-coordinate]")].map(el => ({ square: el.dataset.coordinate, label: el.getAttribute("aria-label") })).filter(p => p.label !== ${JSON.stringify(words.round.squareEmpty)}.replace("{square}", p.square))`;
  const pieceOf = ({ square, label }) => label.slice(words.round.squareWith.replace("{square}", square).indexOf("{piece}"));
  await page.goto(`${baseUrl}/game`);
  await page.waitFor(`[...document.querySelectorAll("button")].some(b => b.textContent.trim() === ${JSON.stringify(words.start)})`);
  await page.clickText("button", words.preset);
  await page.clickText("button", words.start);
  await page.waitFor(phaseIs("study"));
  const pieces = (await page.eval(cells)).map((cell) => ({ square: cell.square, piece: pieceOf(cell) }));
  if (pieces.length === 0) throw new Error("the study board shows no pieces");
  await page.clickText("button", words.round.done);
  await page.waitFor(phaseIs("rebuild"));
  for (const { square, piece } of pieces) {
    const palette = `.lab-palette [aria-label^="${words.round.paletteItem.split("{count}")[0].replace("{piece}", piece)}"]`;
    if ((await page.eval(`document.querySelector('${palette}').getAttribute("aria-pressed")`)) !== "true") await page.click(palette);
    await page.click(`[data-coordinate="${square}"]`);
  }
  await page.clickText("button", words.round.submit);
  await page.waitFor(`!!document.getElementById("game-result-heading")`, 20_000);
  return pieces.length;
}

export default async function drive(page, { baseUrl }) {
  const exchanges = [];
  await page.send("Network.enable");
  page.on((method, params) => {
    if (method === "Network.requestWillBeSent" && params.request.method === "POST" && params.request.url.endsWith("/api/leaderboard")) {
      exchanges.push({ requestId: params.requestId, body: JSON.parse(params.request.postData) });
    }
    if (method === "Network.responseReceived") {
      const exchange = exchanges.find((e) => e.requestId === params.requestId);
      if (exchange) exchange.status = params.response.status;
    }
  });

  const rounds = [];
  for (const [index, playerName] of names.entries()) {
    const pieceCount = await playRound(page, baseUrl);
    await page.sleep(1500);
    if (await page.eval(`!!document.getElementById("game-feedback")`)) {
      await page.send("Input.dispatchKeyEvent", { type: "rawKeyDown", ...ESCAPE });
      await page.send("Input.dispatchKeyEvent", { type: "keyUp", ...ESCAPE });
      await page.waitFor(`!document.getElementById("game-feedback")`);
    }
    const ratingOnScreen = await page.eval(
      `(() => { const el = document.querySelector('[data-figure="rating"]'); return el ? el.innerText.replace(/\\n+/g, " ") : null; })()`,
    );
    const storedRating = await page.eval(`JSON.parse(localStorage.getItem("memory-chess-storage")).state.gameState.skillRating`);
    await page.screenshot(`${shotPrefix}-${index + 1}-result.png`);
    await page.clickText("button", "Submit to leaderboard");
    await page.waitFor(`!!document.getElementById("player-name")`);
    await mouseClick(page, "#player-name");
    await page.send("Input.insertText", { text: playerName });
    await page.waitFor(`document.getElementById("player-name").value === ${JSON.stringify(playerName)}`);
    await page.clickText("button", "Submit score");
    await page.waitFor(
      `(() => { const d = document.querySelector('[role="dialog"]'); return !!d && (d.innerText.includes("Error:") || d.innerText.includes("Score submitted")); })()`,
      20_000,
    );
    const deadline = Date.now() + 10_000;
    while (exchanges.length <= index || exchanges[index].status === undefined) {
      if (Date.now() > deadline) throw new Error("no response to the leaderboard POST");
      await page.sleep(100);
    }
    await page.screenshot(`${shotPrefix}-${index + 1}-dialog.png`);
    const dialog = await page.eval(`document.querySelector('[role="dialog"]').innerText.replace(/\\n+/g, " | ")`);
    rounds.push({ playerName, pieceCount, ratingOnScreen, storedRating, sentRating: exchanges[index].body.skill_rating, difficulty: exchanges[index].body.difficulty, status: exchanges[index].status, submitted: dialog.includes("Score submitted") });
  }
  return { rounds };
}
