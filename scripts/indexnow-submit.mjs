import { mkdir, readFile, writeFile } from "node:fs/promises";
import { run } from "./indexnow-lib.mjs";

process.exitCode = await run(process.argv.slice(2), {
  fetch,
  readFile,
  writeFile,
  mkdir,
  log: console.log,
  error: console.error,
});
