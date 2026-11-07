import { writeFileSync } from "node:fs";
import { join } from "node:path";

// A browser without container query units: drops every declaration whose value uses them (inline or in a stylesheet),
// ignores container-type, and evaluates @supports (width: 1cqw) as false.
const DROP_CQ = `(() => {
  const dropped = [];
  const CQ = /\\d(cq[whib]|cqmin|cqmax)\\b/;
  const scrub = (style, where) => {
    for (const prop of [...style]) {
      const value = style.getPropertyValue(prop);
      if (prop === "container-type" || (!prop.startsWith("--") && CQ.test(value))) { dropped.push(where + " " + prop + ": " + value); style.removeProperty(prop); }
    }
  };
  for (const el of document.querySelectorAll("[style]")) scrub(el.style, "inline");
  const walk = (list, owner) => {
    for (let i = list.length - 1; i >= 0; i--) {
      const rule = list[i];
      if (rule instanceof CSSSupportsRule && /cq/.test(rule.conditionText)) {
        const negated = /^\\s*not\\s/.test(rule.conditionText);
        const inner = [...rule.cssRules].map((r) => r.cssText);
        owner.deleteRule(i);
        dropped.push("@supports " + rule.conditionText + (negated ? " -> applied" : " -> removed"));
        if (negated) inner.reverse().forEach((text) => owner.insertRule(text, i));
        continue;
      }
      if (rule.style) scrub(rule.style, "rule " + (rule.selectorText ?? ""));
      if (rule.cssRules) walk(rule.cssRules, rule);
    }
  };
  for (const sheet of document.styleSheets) { try { walk(sheet.cssRules, sheet); } catch (e) { dropped.push("unreadable sheet " + sheet.href); } }
  return dropped;
})()`;

const MEASURE = `(() => {
  const r = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; };
  const board = document.querySelector("[data-round-board]");
  const square = document.querySelector("[data-coordinate]");
  const rows = [...board.parentElement.querySelectorAll(":scope > section")].map(r);
  const column = board.closest(".lab-active-column");
  const cb = column.getBoundingClientRect();
  return { board: r(board), square: r(square), wrapper: r(board.parentElement), rows, column: r(column), columnTop: Math.round(cb.top), overflowX: document.documentElement.scrollWidth - innerWidth, mainScroll: (() => { const m = document.querySelector("main"); return m.scrollHeight - m.clientHeight; })() };
})()`;

export default async function noCq(page, { baseUrl, evidenceDir }) {
  const out = {};
  for (const [width, height] of [[390, 844], [1440, 900], [844, 390]]) {
    await page.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: Math.min(width, height) < 600 });
    await page.goto(`${baseUrl}/game?pieceCount=6&memorizeTime=60`);
    await page.waitFor(`document.querySelectorAll("[data-coordinate]").length === 64`, 30000);
    if (await page.eval(`!!document.querySelector(".round-gate button:not([disabled])")`)) await page.click(".round-gate button");
    await page.waitFor(`document.querySelector("[data-round-phase]")?.dataset.roundPhase === "study"`, 30000);
    await page.sleep(800);
    const before = await page.eval(MEASURE);
    await page.screenshot(`cq-${width}x${height}.png`);
    const dropped = await page.eval(DROP_CQ);
    await page.sleep(300);
    const after = await page.eval(MEASURE);
    await page.screenshot(`nocq-${width}x${height}.png`);
    out[`${width}x${height}`] = { before, dropped, after };
  }
  writeFileSync(join(evidenceDir, "no-cq.json"), JSON.stringify(out, null, 2));
  const brief = Object.fromEntries(Object.entries(out).map(([k, v]) => [k, { cq: v.before.board, cqSquare: v.before.square[0], nocq: v.after.board, nocqSquare: v.after.square[0], nocqRows: v.after.rows.map((r) => r[0]), mainScroll: v.after.mainScroll }]));
  const fits = Object.values(out).every(({ before, after }) =>
    after.board[0] === after.board[1] && after.board[0] <= after.column[0] && after.square[0] >= 26 && Math.abs(after.board[0] - before.board[0]) <= 0.05 * before.board[0]);
  if (!fits) throw new Error("board not sized to the column without container units: " + JSON.stringify(brief));
  return brief;
}
