import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const AUDIT_PATH = join(__dirname, "..", "audit-adsense.mjs");
const AUDIT_URL = pathToFileURL(AUDIT_PATH).href;

/**
 * Runs an export of the real audit script in a separate Node process, since the
 * script is an ES module Jest does not load, and returns what it printed.
 */
export function runAudit(expression: string): string {
  const program = `const audit = await import(${JSON.stringify(AUDIT_URL)}); process.stdout.write(String(${expression}));`;
  return execFileSync(process.execPath, ["--input-type=module", "-e", program], { encoding: "utf8" });
}
