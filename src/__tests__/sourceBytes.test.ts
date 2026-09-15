import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Built from code points so this file cannot itself contain the bytes it bans.
const BANNED = [
  { name: "NUL", char: String.fromCharCode(0) },
  { name: "LINE SEPARATOR", char: String.fromCharCode(0x2028) },
  { name: "PARAGRAPH SEPARATOR", char: String.fromCharCode(0x2029) },
];

const TEXT_FILE = /\.(?:[cm]?[jt]sx?|json|md|css)$/;

function trackedTextFiles(): string[] {
  return execFileSync("git", ["ls-files", "-co", "--exclude-standard"], { encoding: "utf8" })
    .split("\n")
    .filter((file) => TEXT_FILE.test(file) && !file.startsWith(".claude/worktrees/"));
}

test("no source file carries a raw NUL or Unicode line separator", () => {
  // A JS line separator inside a regex literal is a syntax error, and a NUL
  // makes git store the file as binary so its diff disappears from review.
  // Both have reached this repo when an escape was typed through a tool that
  // wrote the character instead of the escape; write \u0000 or \u2029.
  const offenders = trackedTextFiles().flatMap((file) => {
    const text = readFileSync(file, "utf8");
    return BANNED.filter(({ char }) => text.includes(char)).map(({ name }) => `${file}: ${name}`);
  });

  expect(offenders).toEqual([]);
});
