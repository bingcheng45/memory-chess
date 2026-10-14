const fs = require("fs");
const path = require("path");
const root = process.argv[2];
const { transform } = require(path.join(root, "node_modules/sucrase"));
const dir = path.join(root, "src/lib/seo/learn/guides");
const orderSrc = fs.readFileSync(path.join(dir, "index.ts"), "utf8");
const order = [...orderSrc.matchAll(/from "\.\/([^"]+)"/g)].map((m) => m[1]);
function load(file) {
  const code = transform(fs.readFileSync(file, "utf8"), { transforms: ["typescript", "imports"] }).code;
  const mod = { exports: {} };
  new Function("module", "exports", "require", code)(mod, mod.exports, () => ({}));
  return mod.exports;
}
function words(s) { return s.split(/\s+/).filter(Boolean).length; }
function blockText(b) {
  switch (b.kind) {
    case "paragraphs": return b.paragraphs.join(" ");
    case "steps": return b.items.join(" ");
    case "callout": return b.title + " " + b.body;
    case "drills": return b.drills.map((d) => [d.title, d.description, d.goal, d.duration].join(" ")).join(" ");
    case "comparison": return b.columns.join(" ") + " " + b.rows.map((r) => [r.label, r.struggling, r.stronger].join(" ")).join(" ");
    case "plan": return b.steps.map((s) => [s.label, s.duration, s.detail].join(" ")).join(" ");
  }
  return "";
}
const out = order.map((name) => {
  const m = load(path.join(dir, name + ".ts"));
  const g = m.default;
  const body = g.sections.flatMap((s) => [s.title, s.summary || "", ...s.blocks.map(blockText)]).join(" ");
  const faq = g.faq.map((f) => f.question + " " + f.answer).join(" ");
  const kinds = {};
  g.sections.forEach((s) => s.blocks.forEach((b) => { kinds[b.kind] = (kinds[b.kind] || 0) + 1; }));
  const links = [];
  g.sections.forEach((s) => s.blocks.forEach((b) => {
    if (b.link) links.push(b.link.href);
    if (b.kind === "drills") b.drills.forEach((d) => d.link && links.push(d.link.href));
  }));
  const drillCtas = [];
  g.sections.forEach((s) => s.blocks.forEach((b) => b.kind === "drills" && b.drills.forEach((d) => drillCtas.push({ section: s.id, label: d.ctaLabel, setup: d.setup || null }))));
  return {
    ...g,
    _file: name,
    _words: words([g.h1, g.description, g.quickAnswer, ...(g.keyTakeaways || []), ...(g.whoThisIsFor || []), body, faq].join(" ")),
    _kinds: kinds,
    _inlineLinks: links,
    _drillCtas: drillCtas,
    _positions: m.positions || [],
  };
});
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 2));
for (const g of out) {
  console.log([
    g.slug, g.goal, g._words, JSON.stringify(g._kinds), "faq=" + g.faq.length,
    "rel=" + g.relatedArticles.map((r) => r.slug).join(","),
    "fr=" + (g.furtherReading || []).map((r) => r.slug).join(","),
    "src=" + g.sources.length, "pos=" + g._positions.length,
    "inl=" + g._inlineLinks.join(","), g.featured ? "FEATURED" : "",
    g.timeToRead, g.difficulty, g.updatedAt.slice(0, 10),
  ].join(" | "));
}
