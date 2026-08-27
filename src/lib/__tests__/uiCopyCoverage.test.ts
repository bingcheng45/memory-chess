import fs from "node:fs";
import path from "node:path";

import { LOCALES, DEFAULT_LOCALE } from "@/i18n/routing";

const MESSAGES_DIR = path.join(process.cwd(), "messages");
const NON_DEFAULT_LOCALES = LOCALES.filter(
  (locale) => locale !== DEFAULT_LOCALE,
);

type Catalogue = Record<string, unknown>;

function load(locale: string): Catalogue {
  return JSON.parse(
    fs.readFileSync(path.join(MESSAGES_DIR, `${locale}.json`), "utf8"),
  ) as Catalogue;
}

function at(catalogue: Catalogue, keyPath: string): unknown {
  return keyPath
    .split(".")
    .reduce<unknown>(
      (node, key) =>
        node && typeof node === "object"
          ? (node as Record<string, unknown>)[key]
          : undefined,
      catalogue,
    );
}

const catalogues = Object.fromEntries(
  LOCALES.map((locale) => [locale, load(locale)]),
);

/**
 * Prose that has to read differently in every locale.
 *
 * validate-messages.mjs only proves a key *exists*, which is exactly why
 * `common.footer.copyright` shipped as English inside the Japanese and Korean
 * catalogues: the key was present, so nothing complained. Every entry here is
 * a full sentence with no proper-noun-only content, so an exact match against
 * English means the string was copied rather than translated.
 */
const MUST_DIFFER = [
  "common.footer.copyright",
  "leaderboard.subtitle",
  "leaderboard.emptyCta",
  "game.feedback.description",
];

/** Board a11y copy is looked up per colour+piece, never composed. */
const PIECE_COLORS = ["white", "black"] as const;
const PIECE_TYPES = [
  "pawn",
  "knight",
  "bishop",
  "rook",
  "queen",
  "king",
] as const;

describe("UI copy coverage", () => {
  it.each(MUST_DIFFER)("translates %s in every locale", (keyPath) => {
    const english = at(catalogues[DEFAULT_LOCALE], keyPath);
    expect(typeof english).toBe("string");

    for (const locale of NON_DEFAULT_LOCALES) {
      const value = at(catalogues[locale], keyPath);
      expect(typeof value).toBe("string");
      // Compared with the locale prefixed so a failure names the catalogue.
      expect(`${locale}: ${value}`).not.toBe(`${locale}: ${english}`);
    }
  });

  it("names every piece and colour on the board in every locale", () => {
    // ResponsiveChessBoard and the piece picker build their aria-label and alt
    // text from these keys. A missing entry reads the raw key path aloud.
    for (const locale of LOCALES) {
      for (const color of PIECE_COLORS) {
        for (const type of PIECE_TYPES) {
          const value = at(
            catalogues[locale],
            `game.board.pieces.${color}.${type}`,
          );
          expect(`${locale}.${color}.${type}: ${typeof value}`).toBe(
            `${locale}.${color}.${type}: string`,
          );
          expect(String(value).trim()).not.toBe("");
        }
      }
    }
  });
});
