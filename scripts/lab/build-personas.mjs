#!/usr/bin/env node
/**
 * Writes each lab persona (src/lib/lab/personas.ts) as the v2 export the app
 * would produce, so a browser can load it through the real Import control.
 * Days count back from today, so streaks and staleness read the same on any day.
 *
 *   npm run lab:personas -- [--today YYYY-MM-DD] [--out dir]...   (default out: .lab-personas)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { IDBFactory } from "fake-indexeddb";
import "./ts-hooks.mjs";

const fromSrc = (path) => import(pathToFileURL(join(process.cwd(), "src", path)).href);
const { exportPersona, memoryLabStore, PERSONA_NAMES } = await fromSrc("lib/lab/personas.ts");
const { localDayOf } = await fromSrc("lib/lab/record.ts");
const { isCalendarDay } = await fromSrc("lib/lab/transfer.ts");

const args = process.argv.slice(2);
const valuesOf = (flag) => args.flatMap((arg, index) => (arg === flag && args[index + 1] ? [args[index + 1]] : []));
const today = valuesOf("--today")[0] ?? localDayOf(new Date());
if (!isCalendarDay(today)) {
  console.error(`--today must be a real calendar day as YYYY-MM-DD, got "${today}".`);
  process.exit(2);
}
const outs = valuesOf("--out");
const outDirs = outs.length > 0 ? outs : [".lab-personas"];

for (const dir of outDirs) mkdirSync(resolve(dir), { recursive: true });
for (const name of PERSONA_NAMES) {
  const file = await exportPersona(name, memoryLabStore(new IDBFactory()), today, Date.now());
  const text = JSON.stringify(file);
  for (const dir of outDirs) writeFileSync(join(resolve(dir), `${name}.json`), text);
  console.log(`${name}: ${file.rounds.length} rounds, summary ${file.summary?.rounds ?? 0}`);
}
console.log(`personas for ${today} in ${outDirs.join(", ")}`);
