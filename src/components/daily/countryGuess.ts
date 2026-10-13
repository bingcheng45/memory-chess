import { parseCountryCode, WORLD_CODE, type CountryCode } from "@/lib/leaderboard/countries";

/** Where a prefilled country came from, strongest first: a country picked before, the connection, the browser's language. */
export type CountrySource = "saved" | "connection" | "language";

export interface CountryGuess {
  readonly code: CountryCode;
  readonly source: CountrySource;
}

interface CountrySignals {
  readonly saved: CountryCode;
  readonly geo: string | null;
  readonly languages: readonly string[];
}

const countryOf = (value: unknown): CountryCode | null => {
  const code = parseCountryCode(value);
  return code === WORLD_CODE ? null : code;
};

function regionOf(tag: string): CountryCode | null {
  try {
    return countryOf(new Intl.Locale(tag).region);
  } catch {
    return null;
  }
}

/** The daily board has no world entry, so a guess is a real country or nothing, and nothing leaves the field to the player. */
export function guessCountry({ saved, geo, languages }: CountrySignals): CountryGuess | null {
  const picked = countryOf(saved);
  if (picked) return { code: picked, source: "saved" };
  const connection = countryOf(geo);
  if (connection) return { code: connection, source: "connection" };
  const language = languages.map(regionOf).find((code) => code !== null);
  return language ? { code: language, source: "language" } : null;
}
