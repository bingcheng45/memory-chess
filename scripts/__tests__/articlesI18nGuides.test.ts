/** @jest-environment node */
import { buttonFailures } from "../articles-i18n/guides.mjs";

const ENGLISH = [
  { key: "game.result.tryAgain", label: "Try again" },
  { key: "game.round.start", label: "Start" },
];
const GERMAN = [
  { key: "game.result.tryAgain", label: "Nochmal" },
  { key: "game.round.start", label: "Start" },
];

describe("the guide button rule", () => {
  it("fails a translated string that drops the translated label of a button its English names", () => {
    expect(buttonFailures(ENGLISH, GERMAN, "guide", { a: "Press Try again twice." }, { a: "Drück zweimal Neu." })).toEqual([
      'guide a: names the button game.result.tryAgain, which the game shows as "Nochmal" here',
    ]);
  });

  it("passes the translated label, and counts a one-word label only after press", () => {
    expect(buttonFailures(ENGLISH, GERMAN, "guide", { a: "Press Try again twice." }, { a: "Drück zweimal „Nochmal“." })).toEqual([]);
    expect(buttonFailures(ENGLISH, GERMAN, "guide", { a: "Start with two kings." }, { a: "Beginne mit zwei Königen." })).toEqual([]);
    expect(buttonFailures(ENGLISH, GERMAN, "guide", { a: "Then press Start." }, { a: "Dann drück auf Los." })).toEqual([
      'guide a: names the button game.round.start, which the game shows as "Start" here',
    ]);
  });
});
