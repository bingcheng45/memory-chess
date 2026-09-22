import { readdirSync, readFileSync } from "node:fs";

const QUALIFIES_SENTENCE = "Your score makes the leaderboard. Submit it before it's gone.";

const messagesDir = new URL("../../../../messages/", import.meta.url);

function everyTranslation() {
  return readdirSync(messagesDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => [
      name.replace(/\.json$/, ""),
      JSON.parse(readFileSync(new URL(name, messagesDir), "utf8")).game.result
        .leaderboardQualifies,
    ]);
}

function sentenceShown(page) {
  return page.eval(
    `[...document.querySelectorAll('[role="status"]')]
       .some(el => el.textContent.includes(${JSON.stringify(QUALIFIES_SENTENCE)}))`,
  );
}

async function localesWrappingPastTwoLines(page) {
  return JSON.parse(
    await page.eval(
      `(() => {
         const el = [...document.querySelectorAll('[role="status"]')]
           .find(node => node.textContent.includes("leaderboard") || node.textContent.length > 8);
         if (!el) {
           throw new Error("no nudge on screen to measure");
         }
         const original = el.textContent;
         const tall = [];
         for (const [locale, sentence] of ${JSON.stringify(everyTranslation())}) {
           el.textContent = sentence;
           const range = document.createRange();
           range.selectNodeContents(el);
           const lines = range.getClientRects().length;
           if (lines > 2) tall.push([locale, lines, sentence]);
         }
         el.textContent = original;
         return JSON.stringify(tall);
       })()`,
    ),
  );
}

export default async function drive(page, { baseUrl }) {
  await page.goto(`${baseUrl}/game`);
  const cutoffs = await page.eval(
    `fetch("/api/leaderboard/cutoffs").then(r => r.json()).then(b => JSON.stringify(b.data))`,
  );
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
  // Memorize time is what the player actually spent looking, so lingering here
  // is how a round is driven under the cutoff instead of over it.
  const linger = Number(process.env.MEMORIZE_LINGER_MS ?? 0);
  if (linger > 0) {
    await page.sleep(linger);
  }
  await page.clickText("button", "Skip");

  await page.waitFor(`!!document.querySelector('[aria-label="Select white pieces"]')`);
  for (const p of pieces) {
    const piece = p.label.split(" with ")[1];
    const color = piece.split(" ")[0];
    await page.click(`[aria-label="Select ${color} pieces"]`);
    await page.click(`[aria-label="Select ${piece}"]`);
    await page.click(`[role="button"][data-coordinate="${p.square}"]`);
  }
  await page.clickText("button", "Submit");

  await page.waitFor(`!!document.getElementById("game-result-heading")`, 20_000);
  await page.waitFor(
    `[...document.querySelectorAll("button")].some(b => b.textContent.includes("Submit to Leaderboard"))`,
    10_000,
  );

  // The round's own numbers come off the result screen rather than the
  // persisted store, which holds the configured memorize time and not the
  // elapsed one, so it would disagree with what the player is looking at.
  const played = JSON.parse(
    await page.eval(
      `(() => {
         const seconds = (text) => {
           const [m, s, ms] = text.trim().split(":").map(Number);
           return m * 60 + s + ms / 1000;
         };
         const read = (label) => {
           const dt = [...document.querySelectorAll("dt")].find(el => el.textContent.trim() === label);
           return dt ? dt.parentElement.querySelector("dd").textContent : null;
         };
         return JSON.stringify({
           piecesCorrect: read("Pieces Correct"),
           memorizeTime: seconds(read("Memorization Time")),
           solutionTime: seconds(read("Solution Time")),
         });
       })()`,
    ),
  );
  const shown = await sentenceShown(page);
  await page.screenshot("1-result-with-nudge.png");

  const worst = JSON.parse(cutoffs).easy.worst;

  // The comparison below only reaches the time keys because a clean round ties
  // the cutoff on the two that outrank them. A missed click would score fewer
  // correct pieces, and then this oracle would be answering a question the
  // board never asked.
  if (played.piecesCorrect.trim() !== "2 / 2") {
    throw new Error(`round scored ${played.piecesCorrect}, so the cutoff comparison below does not hold`);
  }
  const beatsCutoff =
    played.memorizeTime < worst.memorizeTime ||
    (played.memorizeTime === worst.memorizeTime && played.solutionTime < worst.solutionTime);

  if (shown !== beatsCutoff) {
    throw new Error(
      `the board says this round ${beatsCutoff ? "qualifies" : "does not qualify"} but the screen ${shown ? "shows" : "hides"} the nudge; round was ${JSON.stringify(played)} against ${JSON.stringify(worst)}`,
    );
  }

  await page.send("Emulation.setDeviceMetricsOverride", {
    width: 320,
    height: 760,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await page.screenshot("2-narrow-320.png");
  const overflowing = shown ? await localesWrappingPastTwoLines(page) : [];
  await page.send("Emulation.clearDeviceMetricsOverride");

  if (overflowing.length) {
    throw new Error(
      `these locales wrap past two lines at 320px: ${JSON.stringify(overflowing)}`,
    );
  }

  await page.clickText("button", "Submit to Leaderboard");
  await page.waitFor(`!!document.querySelector('input')`);
  await page.eval(
    `(() => {
       const input = document.querySelector('input');
       const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
       setter.call(input, "PotetoBot");
       input.dispatchEvent(new Event("input", { bubbles: true }));
       return input.value;
     })()`,
  );
  await page.clickText("button", "Submit Score");
  await page.sleep(1500);

  const stillShown = await sentenceShown(page);
  const submitted = await page.eval(`document.body.innerText.includes("Score Submitted")`);
  await page.screenshot("3-after-submit.png");

  if (submitted && stillShown) {
    throw new Error("the nudge survived a successful submission");
  }

  return {
    easyCutoff: worst,
    round: played,
    roundQualifies: beatsCutoff,
    nudgeShownOnResult: shown,
    localesWrappingPastTwoLines: overflowing.length,
    submissionSucceeded: submitted,
    nudgeAfterSubmit: stillShown,
  };
}
