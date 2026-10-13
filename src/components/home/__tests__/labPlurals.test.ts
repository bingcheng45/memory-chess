/** @jest-environment node */

import { IntlMessageFormat } from "intl-messageformat";
import cs from "../../../../messages/cs.json";
import de from "../../../../messages/de.json";
import en from "../../../../messages/en.json";
import pl from "../../../../messages/pl.json";
import ru from "../../../../messages/ru.json";

const format = (message: string, locale: string, values: Record<string, number>) =>
  String(new IntlMessageFormat(message, locale).format(values));

describe("home.lab counted copy", () => {
  it("counts the density meter in pieces, not squares", () => {
    expect(format(en.home.lab.tiers.loadLabel, "en", { pieceCount: 12 })).toBe("12 of 32 pieces");
    expect(format(ru.home.lab.tiers.loadLabel, "ru", { pieceCount: 12 })).toBe("Фигуры: 12 из 32");
  });

  it("compares one recent round in the singular and several as an average", () => {
    const { above, below, level } = en.home.lab.resultCard.vsRecent;
    expect(format(above, "en", { points: 4, rounds: 1 })).toBe("4 points above your last round at this setting");
    expect(format(below, "en", { points: 1, rounds: 3 })).toBe("1 point below your average over your last 3 rounds at this setting");
    expect(format(level, "en", { rounds: 1 })).toBe("Level with your last round at this setting");
    expect(format(ru.home.lab.resultCard.vsRecent.level, "ru", { rounds: 3 })).toBe(
      "На уровне вашего среднего за последние 3 раунда при этой настройке",
    );
    expect(format(ru.home.lab.resultCard.vsRecent.level, "ru", { rounds: 5 })).toBe(
      "На уровне вашего среднего за последние 5 раундов при этой настройке",
    );
  });

  it("agrees the languages label with the count in each grammar", () => {
    const languages = (catalogue: typeof en, locale: string) => format(catalogue.home.lab.hero.facts.languages, locale, { count: 24 });
    expect(languages(en, "en")).toBe("languages");
    expect(languages(de, "de")).toBe("Sprachen");
    expect(languages(ru, "ru")).toBe("языка");
    expect(languages(pl, "pl")).toBe("języki");
    expect(languages(cs, "cs")).toBe("jazyků");
  });

  it("agrees the games-played label with the count", () => {
    const plays = (count: number) => format(ru.home.lab.hero.facts.plays, "ru", { count });
    expect([plays(1), plays(46543), plays(46545)]).toEqual(["сыгранная партия", "сыгранные партии", "сыгранных партий"]);
  });
});
