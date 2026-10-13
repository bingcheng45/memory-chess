const fs = require("fs");
const path = require("path");
const root = process.argv[2];
const { transform } = require(path.join(root, "node_modules/sucrase"));
const dir = path.join(root, "src/lib/articles/entries");
const out = [];
for (const f of fs.readdirSync(dir)) {
  const code = transform(fs.readFileSync(path.join(dir, f), "utf8"), { transforms: ["typescript", "imports"] }).code;
  const mod = { exports: {} };
  new Function("module", "exports", "require", code)(mod, mod.exports, () => ({}));
  const a = mod.exports.default || Object.values(mod.exports)[0];
  const text = [a.title, a.description, ...a.sections.flatMap((s) => [s.heading, ...s.paragraphs])].join(" ");
  const words = text.split(/\s+/).filter(Boolean).length;
  const body = a.sections.flatMap((s) => s.paragraphs).join(" ");
  const learnLinks = (body.match(/\/learn\/[a-z0-9-]+/g) || []);
  out.push({ slug: a.slug, title: a.title, searchTitle: a.searchTitle, description: a.description, person: a.person, words, sections: a.sections.map((s) => s.heading), drill: a.drill, relatedGuides: a.relatedGuides, sources: a.sources.length, learnLinks, photo: { src: a.photo.src, author: a.photo.author, license: a.photo.license } });
  console.log(a.slug, words, "sources=" + a.sources.length, JSON.stringify(a.drill), "person=" + a.person.name + "/" + a.person.role);
}
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 2));
