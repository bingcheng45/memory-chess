// Prints the margins of the language rule: how each installed article reads in its own locale, the largest lead of
// another locale in a real leaf, and how every locale fares when it is given another locale's articles.
// The numbers in LANGUAGE_LIMITS of language.mjs come from here. Run it again when a locale or a word list changes.
// usage (repo root): node scripts/articles-i18n/language-margins.mjs
import { LANGUAGE_LIMITS, languageFailures, readingOf } from "./language.mjs";
import { leavesOf } from "./leaves.mjs";
import { BODY_PATH } from "./paths.mjs";
import { loadRepo, readInstalled } from "./repo.mjs";

const repo = await loadRepo(process.cwd());
const LOCALES = repo.translatedLocales;
const READ = LOCALES.filter((locale) => readingOf(locale, "") !== undefined);
const bundles = Object.fromEntries(LOCALES.map((locale) => [locale, readInstalled(repo.root, locale)]));
const say = (line = "") => process.stdout.write(`${line}\n`);
const bodyOf = (text) => leavesOf(text).filter(([path]) => BODY_PATH.test(path));
const wholeOf = (text) => bodyOf(text).map(([, leaf]) => leaf).join(" ");
const failuresOfArticles = (locale, articles) => Object.entries(articles).flatMap(([slug, unit]) => languageFailures(locale, slug, bodyOf(unit.text)));
const closestOf = (reading) => reading.rivals.reduce((top, rival) => (rival.theirs - rival.own > top.theirs - top.own ? rival : top));
const percent = (share) => `${(share * 100).toFixed(1)}%`;

say(`limits: ${JSON.stringify(LANGUAGE_LIMITS)}`);
say(`locales with a profile: ${READ.length} (${READ.join(" ")}); read by their script alone: ${LOCALES.filter((locale) => !READ.includes(locale)).join(" ")}`);

say("\n== 1. The installed files: each article as a whole (size, share of its own words or characters, the closest other locale) ==");
let realFailures = 0;
for (const locale of LOCALES) {
  const failures = failuresOfArticles(locale, bundles[locale].articles);
  realFailures += failures.length;
  const rows = READ.includes(locale)
    ? Object.values(bundles[locale].articles).map((unit) => {
        const reading = readingOf(locale, wholeOf(unit.text));
        const closest = closestOf(reading);
        return `${reading.size} ${reading.unit}, share ${percent(reading.share)}, ${closest.locale} ${closest.theirs} against ${closest.own}`;
      })
    : ["read by its script alone"];
  say(`${locale.padEnd(6)} ${failures.length ? `FAILS ${failures.join(" | ")}` : "ok"}  ${rows.join("; ")}`);
}
say(`failures on the 69 installed files: ${realFailures}`);

say("\n== 2. The installed files: the lead of the closest other locale in each body leaf ==");
const realLeaves = READ.flatMap((locale) =>
  Object.entries(bundles[locale].articles).flatMap(([slug, unit]) =>
    bodyOf(unit.text).map(([path, leaf]) => {
      const reading = readingOf(locale, leaf);
      const closest = closestOf(reading);
      return { locale, slug, path, leaf, size: reading.size, unit: reading.unit, share: reading.share, closest, lead: closest.theirs - closest.own };
    }),
  ),
);
for (const minSize of [20, 30, 40, 60, 80]) {
  const long = realLeaves.filter((row) => row.size >= minSize);
  const counts = [1, 2, 3, 4].map((lead) => `${long.filter((row) => row.lead >= lead).length} with a lead of ${lead} or more`);
  const worst = long.reduce((top, row) => (row.lead > top.lead ? row : top));
  say(`leaves of ${minSize} or more: ${long.length}; ${counts.join(", ")}; largest lead ${worst.lead} (${worst.locale} ${worst.slug} ${worst.path}, ${worst.closest.locale} ${worst.closest.theirs} against ${worst.closest.own}, size ${worst.size})`);
}
realLeaves
  .filter((row) => row.size >= 20 && row.lead >= 0)
  .sort((a, b) => b.lead - a.lead)
  .slice(0, 12)
  .forEach((row) => say(`    lead ${row.lead}: ${row.locale} ${row.slug} ${row.path} size ${row.size}, ${row.closest.locale} ${row.closest.theirs} against ${row.closest.own}: ${row.leaf.slice(0, 100)}`));
const tightest = READ.map((locale) => {
  const long = realLeaves.filter((row) => row.locale === locale && row.size >= LANGUAGE_LIMITS.minSizeOfALeaf);
  const worst = long.reduce((top, row) => (row.lead > top.lead ? row : top));
  return `${locale} ${worst.lead}`;
});
say(`largest lead per locale at the leaf size of ${LANGUAGE_LIMITS.minSizeOfALeaf} (a leaf fails over ${LANGUAGE_LIMITS.maxLeadInALeaf}): ${tightest.join(", ")}`);

say("\n== 3. Locale L given the three installed articles of locale M (the language rule alone) ==");
const pairs = [];
for (const into of LOCALES) {
  for (const from of LOCALES) {
    if (into === from) continue;
    const failures = failuresOfArticles(into, bundles[from].articles);
    pairs.push({ into, from, failures: failures.length, wholes: failures.filter((failure) => failure.includes(": the text as a whole ")).length });
  }
}
const passing = pairs.filter((pair) => pair.failures === 0);
say(`passes: ${passing.length} of ${pairs.length} pairs; all three articles fail as a whole in ${pairs.filter((pair) => pair.wholes === 3).length} pairs`);
for (const into of LOCALES) {
  const accepted = passing.filter((pair) => pair.into === into).map((pair) => pair.from);
  const partly = pairs.filter((pair) => pair.into === into && pair.failures > 0 && pair.wholes < 3).map((pair) => `${pair.from}(${pair.wholes}/3)`);
  if (accepted.length || partly.length) say(`  ${into.padEnd(6)} accepts ${accepted.join(" ") || "none"}; fails without all three wholes failing: ${partly.join(" ") || "none"}`);
}
const margins = pairs
  .filter((pair) => READ.includes(pair.into) && readingOf(pair.into, "").unit === readingOf(pair.from, "")?.unit)
  .flatMap(({ into, from }) =>
    Object.entries(bundles[from].articles).map(([slug, unit]) => {
      const rival = readingOf(into, wholeOf(unit.text)).rivals.find((one) => one.locale === from);
      return { into, from, slug, own: rival.own, theirs: rival.theirs };
    }),
  )
  .sort((a, b) => a.theirs - a.own - (b.theirs - b.own));
say(`the narrowest whole-article margins, of ${margins.length} article and pair combinations among locales read the same way:`);
margins.slice(0, 8).forEach((row) => say(`    ${row.from} text in ${row.into}, ${row.slug}: ${row.theirs} of ${row.from} against ${row.own} of ${row.into}`));

say("\n== 4. One long leaf of locale M inside locale L: how many fail, by the lead a leaf is allowed ==");
const groups = { words: READ.filter((locale) => readingOf(locale, "").unit === "words"), characters: READ.filter((locale) => readingOf(locale, "").unit === "characters") };
for (const [unit, group] of Object.entries(groups)) {
  const foreign = [];
  for (const into of group) {
    for (const from of group) {
      if (into === from) continue;
      for (const unitOfFrom of Object.values(bundles[from].articles)) {
        for (const [, leaf] of bodyOf(unitOfFrom.text)) {
          const reading = readingOf(into, leaf);
          if (reading.size < LANGUAGE_LIMITS.minSizeOfALeaf) continue;
          const closest = closestOf(reading);
          foreign.push({ into, from, lead: closest.theirs - closest.own });
        }
      }
    }
  }
  for (const maxLead of [0, 1, 2, 3]) {
    const missed = foreign.filter((row) => row.lead <= maxLead);
    const byPair = {};
    missed.forEach((row) => (byPair[`${row.from} in ${row.into}`] = (byPair[`${row.from} in ${row.into}`] ?? 0) + 1));
    const worst = Object.entries(byPair).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([pair, count]) => `${pair} ${count}`).join(", ");
    say(`${unit}, lead over ${maxLead} fails: ${foreign.length - missed.length} of ${foreign.length} foreign leaves fail (${percent((foreign.length - missed.length) / foreign.length)}); passing: ${worst || "none"}`);
  }
}
