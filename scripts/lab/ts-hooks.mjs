/**
 * Lets a Node script import app modules from src/ directly. Node's own type
 * stripping cannot: the app uses `@/` paths, extensionless imports and enums.
 * So src/ files are transpiled with the repo's TypeScript and those specifiers
 * resolved here, which keeps fixtures built from the app's real code.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { registerHooks } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const SRC = join(process.cwd(), "src");
const CANDIDATES = ["", ".ts", ".tsx", "/index.ts"];
const inSrc = (url) => url?.startsWith("file:") && fileURLToPath(url).startsWith(SRC);
const isFile = (path) => existsSync(path) && statSync(path).isFile();

registerHooks({
  resolve(specifier, context, nextResolve) {
    const base = specifier.startsWith("@/")
      ? join(SRC, specifier.slice(2))
      : specifier.startsWith(".") && inSrc(context.parentURL)
        ? join(dirname(fileURLToPath(context.parentURL)), specifier)
        : null;
    const hit = base && CANDIDATES.map((suffix) => base + suffix).find(isFile);
    return nextResolve(hit ? pathToFileURL(hit).href : specifier, context);
  },
  load(url, context, nextLoad) {
    if (!inSrc(url) || !/\.tsx?$/.test(url)) return nextLoad(url, context);
    const path = fileURLToPath(url);
    const { outputText } = ts.transpileModule(readFileSync(path, "utf8"), {
      fileName: path,
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    });
    return { format: "module", source: outputText, shortCircuit: true };
  },
});
