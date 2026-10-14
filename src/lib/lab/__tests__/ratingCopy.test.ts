import fs from "node:fs";
import path from "node:path";
import { IntlMessageFormat } from "intl-messageformat";

const DIR = path.join(process.cwd(), "messages");
const LOCALES = fs
  .readdirSync(DIR)
  .filter((file) => file.endsWith(".json"))
  .map((file) => file.replace(".json", ""));

const printed = (pattern: string, locale: string, rounds: number) =>
  new IntlMessageFormat(pattern, locale).format({ sign: "up", change: 4321, rounds }) as string;

describe("dashboard.context.rating", () => {
  it.each(LOCALES)("%s names the change, and does not print a count where its plural form is one round", (locale) => {
    const { dashboard } = JSON.parse(fs.readFileSync(path.join(DIR, `${locale}.json`), "utf8"));
    const single = printed(dashboard.context.rating, locale, 1);

    expect(single).toContain("4321");
    expect(printed(dashboard.context.rating, locale, 7)).toContain("7");
    if (new Intl.PluralRules(locale).select(1) === "one") expect(single).not.toMatch(/(^|\D)1(\D|$)/);
  });
});
