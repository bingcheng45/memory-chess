/** @jest-environment node */
import { loadGuide, type GuideSource } from "@/lib/seo/learn/load";

const BLINDFOLD = "blindfold-chess-training-for-beginners";

describe("loadGuide", () => {
  it("reads a German guide with German chrome and the English guide's rounds", async () => {
    const guide = await loadGuide(BLINDFOLD, "de");

    expect(guide?.locale).toBe("de");
    expect(guide?.page.meta.h1).toBe("Blindschach lernen in vier Stufen, jede mit einer klaren Hürde");
    expect(guide?.page.group.label).toBe("Visualisierung und Variantenberechnung");
    expect(guide?.page.meta.slug).toBe(BLINDFOLD);
    expect(guide?.page.primaryCta).toEqual({ label: "2 Könige blind spielen, nur aus der Notation", pieceCount: 2, memorizeTime: 10, blindfold: true });
    expect(guide?.copy.pieces(2)).toBe("2 Figuren");
    expect(guide?.copy.pieces(1)).toBe("1 Figur");
  });

  it("names Russian counts with the Russian plural forms", async () => {
    const copy = (await loadGuide(BLINDFOLD, "ru"))?.copy;

    expect([1, 2, 5, 21].map((count) => copy?.pieces(count))).toEqual(["1 фигура", "2 фигуры", "5 фигур", "21 фигура"]);
  });

  it("serves the English guide in English and no guide in a locale that has no translation", async () => {
    expect((await loadGuide(BLINDFOLD, "en"))?.page.meta.h1).toBe("How to learn blindfold chess in four stages, each with a pass mark");
    expect(await loadGuide(BLINDFOLD, "it")).toBeUndefined();
    expect(await loadGuide("chess-memory-training", "de")).toBeUndefined();
    expect(await loadGuide("no-such-guide", "en")).toBeUndefined();
  });

  it("refuses a translation made from another English text instead of serving it", async () => {
    const stale: GuideSource = async (locale, unit) => {
      const file = (await import(`@/lib/seo/learn/translations/${locale}/${unit}.json`)).default;
      return unit === "chrome" ? file : { ...file, sourceHash: "0".repeat(64) };
    };

    await expect(loadGuide(BLINDFOLD, "de", stale)).rejects.toThrow(
      `Guide translation de/${BLINDFOLD} cannot be published: sourceHash is stale; not reviewed, the approval is for another text, article or locale`,
    );
  });
});
