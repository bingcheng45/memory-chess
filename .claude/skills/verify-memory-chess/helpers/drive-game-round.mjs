const PREFIX = process.env.GAME_PREFIX ?? "";
const CELLS = `[...document.querySelectorAll("[data-coordinate]")]`;
const phaseIs = (phase) => `document.querySelector("[data-round-phase]")?.dataset.roundPhase === "${phase}"`;

/** Words for the locale under test, read from its catalogue so the drive clicks what a player there sees. */
async function wordsOf(prefix) {
  const { readFileSync } = await import("node:fs");
  const locale = prefix.slice(1) || "en";
  const { game } = JSON.parse(readFileSync(new URL(`../../../../messages/${locale}.json`, import.meta.url), "utf8"));
  return { start: game.config.start, easy: game.presets.easy.label, round: game.round };
}

const occupiedCells = (words) =>
  `${CELLS}.map(el => ({ square: el.dataset.coordinate, label: el.getAttribute("aria-label") }))
     .filter(p => p.label !== ${JSON.stringify(words.round.squareEmpty)}.replace("{square}", p.square))`;

async function place(page, words, square, piece) {
  // A palette button is named for its piece and what is left of it, so match the name and the words before the count.
  const palette = `.lab-palette [aria-label^="${words.round.paletteItem.split("{count}")[0].replace("{piece}", piece)}"]`;
  if ((await page.eval(`document.querySelector('${palette}').getAttribute("aria-pressed")`)) !== "true") await page.click(palette);
  await page.click(`[data-coordinate="${square}"]`);
}

export default async function drive(page, { baseUrl }) {
  const words = await wordsOf(PREFIX);
  const pieceOf = ({ square, label }) => label.slice(words.round.squareWith.replace("{square}", square).indexOf("{piece}"));

  await page.goto(`${baseUrl}${PREFIX}/game`);
  await page.waitFor(`[...document.querySelectorAll("button")].some(b => b.textContent.trim() === ${JSON.stringify(words.start)})`);
  await page.clickText("button", words.easy);
  await page.clickText("button", words.start);

  await page.waitFor(phaseIs("study"));
  const pieces = (await page.eval(occupiedCells(words))).map((cell) => ({ square: cell.square, piece: pieceOf(cell) }));
  if (pieces.length === 0) throw new Error("the study board shows no pieces");
  await page.screenshot("1-study.png");
  await page.clickText("button", words.round.hide);

  await page.waitFor(phaseIs("rebuild"));
  if ((await page.eval(occupiedCells(words))).length !== 0) throw new Error("the board did not clear for the rebuild");
  await place(page, words, pieces[0].square, pieces[0].piece);
  await page.click(`[aria-label="${words.round.clear}"]`);
  if ((await page.eval(occupiedCells(words))).length !== 0) throw new Error("the eraser left pieces on the board");

  for (const { square, piece } of pieces) await place(page, words, square, piece);
  const placed = await page.eval(occupiedCells(words));
  if (placed.length !== pieces.length) throw new Error(`placed ${placed.length} pieces, expected ${pieces.length}`);
  await page.screenshot("2-placed.png");
  await page.clickText("button", words.round.submit);

  await page.waitFor(`!!document.getElementById("game-result-heading")`, 20_000);
  if (!(await page.eval(`document.body.innerText.includes("100")`))) throw new Error("result page does not show 100% accuracy");
  await page.screenshot("3-result.png");

  const stored = await page.eval(`JSON.parse(localStorage.getItem("memory-chess-storage"))?.state ?? null`);
  const persisted = stored?.gameState;
  const row = stored?.history?.[0];
  if (!persisted || typeof persisted.skillRating !== "number" || persisted.pieceCount !== pieces.length) {
    throw new Error(`persisted state disagrees with the round played: ${JSON.stringify(persisted)}`);
  }
  if (row?.facts?.accuracy !== 100 || row.skillRatingChange !== persisted.skillRating - 1000) {
    throw new Error(`the history row does not account for the rating: ${JSON.stringify(row)}`);
  }
  return {
    piecesMemorized: pieces.length,
    accuracyOnScreen: "100%",
    persistedSkillRating: persisted.skillRating,
  };
}
