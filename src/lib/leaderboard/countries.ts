import { ISO_3166_ALPHA2 } from "./countryCodes";

declare const countryCodeBrand: unique symbol;
export type CountryCode = string & { readonly [countryCodeBrand]: true };

/** CLDR names ZZ "Unknown Region"; the UI supplies its own translated "World" label instead. */
export const WORLD_CODE = "ZZ" as CountryCode;

export const COUNTRY_CODES: readonly CountryCode[] = [
  WORLD_CODE,
  ...ISO_3166_ALPHA2.map((code) => code as CountryCode),
];

const KNOWN_CODES: ReadonlySet<string> = new Set(COUNTRY_CODES);

const REGIONAL_INDICATOR_OFFSET = 0x1f1e6 - 0x41;
const GLOBE_CODE_POINT = 0x1f30d;

export function parseCountryCode(value: unknown): CountryCode | null {
  if (typeof value !== "string" || !KNOWN_CODES.has(value)) {
    return null;
  }
  return value as CountryCode;
}

export function flagEmoji(code: CountryCode): string {
  if (code === WORLD_CODE) {
    return String.fromCodePoint(GLOBE_CODE_POINT);
  }
  return String.fromCodePoint(
    ...[...code].map((letter) => letter.charCodeAt(0) + REGIONAL_INDICATOR_OFFSET),
  );
}

export function countryName(code: CountryCode, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}
