import { execFile, execFileSync } from "node:child_process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const AUDIT_PATH = join(__dirname, "..", "audit-adsense.mjs");
const AUDIT_URL = pathToFileURL(AUDIT_PATH).href;

// Jest does not load ES modules, so the script runs in a separate Node process.
export function runAudit(expression: string): string {
  const program = `const audit = await import(${JSON.stringify(AUDIT_URL)}); process.stdout.write(String(${expression}));`;
  return execFileSync(process.execPath, ["--input-type=module", "-e", program], { encoding: "utf8" });
}

export type AuditRun = { code: number; stdout: string; stderr: string };

// Not execFileSync: a site served from the Jest process cannot answer while that process is blocked.
export function runAuditCli(args: string[]): Promise<AuditRun> {
  return new Promise((resolve) => {
    execFile(process.execPath, [AUDIT_PATH, ...args], { encoding: "utf8" }, (error, stdout, stderr) => {
      resolve({ code: error ? Number(error.code) : 0, stdout, stderr });
    });
  });
}
