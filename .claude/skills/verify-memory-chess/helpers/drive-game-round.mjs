export default async function drive(page, { baseUrl }) {
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
  if (pieces.length === 0) {
    throw new Error("memorization board shows no pieces");
  }
  await page.screenshot("1-memorize.png");
  await page.clickText("button", "Skip");

  await page.waitFor(`!!document.querySelector('[aria-label="Select white pieces"]')`);
  for (const p of pieces) {
    const piece = p.label.split(" with ")[1];
    const color = piece.split(" ")[0];
    await page.click(`[aria-label="Select ${color} pieces"]`);
    await page.click(`[aria-label="Select ${piece}"]`);
    await page.click(`[role="button"][data-coordinate="${p.square}"]`);
  }
  const placed = await page.eval(
    `[...document.querySelectorAll('[role="button"][data-coordinate]')]
       .filter(el => (el.getAttribute("aria-label") || "").includes(" with ")).length`,
  );
  if (placed !== pieces.length) {
    throw new Error(`placed ${placed} pieces, expected ${pieces.length}`);
  }
  await page.screenshot("2-placed.png");
  await page.clickText("button", "Submit");

  await page.waitFor(`!!document.getElementById("game-result-heading")`, 20_000);
  const accuracyShown = await page.eval(
    `document.body.innerText.includes("100%")`,
  );
  if (!accuracyShown) {
    throw new Error("result page does not show 100% accuracy");
  }
  await page.screenshot("3-result.png");

  const persisted = await page.eval(
    `JSON.parse(localStorage.getItem("memory-chess-storage"))?.state?.gameState ?? null`,
  );
  if (
    !persisted ||
    typeof persisted.skillRating !== "number" ||
    persisted.pieceCount !== pieces.length
  ) {
    throw new Error(
      `persisted state disagrees with the round played: ${JSON.stringify(persisted)}`,
    );
  }
  return {
    piecesMemorized: pieces.length,
    accuracyOnScreen: "100%",
    persistedSkillRating: persisted.skillRating,
  };
}
