/**
 * Rewrites every legacy Learn guide in src/lib/seo/learn/guides into the LearnDocument template, in place.
 * The legacy files are gone after the migration commit, so rerun it from that commit's parent:
 *   git checkout <migration>^ -- src/lib/seo/learn/guides && node scripts/learn/migrate-guides.mjs
 */
import "../lab/ts-hooks.mjs";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const DIR = join(process.cwd(), "src/lib/seo/learn/guides");
const { convertGuide } = await import(pathToFileURL(join(process.cwd(), "scripts/learn/convertGuide.ts")).href);
const { AUTHORED } = await import(pathToFileURL(join(process.cwd(), "scripts/learn/authored.ts")).href);

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

const MAX_LINE = 120;

function inline(value) {
  if (Array.isArray(value)) return `[${value.map(inline).join(", ")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value).filter(([, item]) => item !== undefined);
    return `{ ${entries.map(([key, item]) => `${IDENTIFIER.test(key) ? key : JSON.stringify(key)}: ${inline(item)}`).join(", ")} }`;
  }
  return JSON.stringify(value);
}

function literal(value, indent = "") {
  const short = inline(value);
  if (typeof value !== "object" || value === null || indent.length + short.length <= MAX_LINE - 20) return short;
  const inner = `${indent}  `;
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return `[\n${value.map((item) => `${inner}${literal(item, inner)},`).join("\n")}\n${indent}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value).filter(([, item]) => item !== undefined);
    return `{\n${entries
      .map(([key, item]) => `${inner}${IDENTIFIER.test(key) ? key : JSON.stringify(key)}: ${literal(item, inner)},`)
      .join("\n")}\n${indent}}`;
  }
  return JSON.stringify(value);
}

const order = [...readFileSync(join(DIR, "index.ts"), "utf8").matchAll(/^import \w+(?:, \{[^}]+\})? from "\.\/([^"]+)";$/gm)].map(
  (match) => match[1],
);

const names = [];
for (const file of order) {
  const module = await import(pathToFileURL(join(DIR, `${file}.ts`)).href);
  const guide = module.default;
  const authored = AUTHORED[guide.slug];
  if (!authored) throw new Error(`no authored data for ${guide.slug}`);
  const doc = convertGuide(guide, module.positions ?? [], authored);
  writeFileSync(
    join(DIR, `${file}.ts`),
    `import type { LearnDocument } from "../schema";\n\nconst guide: LearnDocument = ${literal(doc)};\n\nexport default guide;\n`,
  );
  names.push(file);
}

const ident = (file) => file.replace(/^\d+/, (digits) => `n${digits}`).replace(/-(\w)/g, (_, c) => c.toUpperCase());
writeFileSync(
  join(DIR, "index.ts"),
  `import type { LearnDocument } from "../schema";\n${names.map((file) => `import ${ident(file)} from "./${file}";`).join("\n")}\n\n` +
    `/** Display order. Within a group the hub lists guides in this order, easiest first. */\n` +
    `export const LEARN_GUIDES: readonly LearnDocument[] = [\n${names.map((file) => `  ${ident(file)},`).join("\n")}\n];\n`,
);
console.log(`converted ${names.length} guides`);
