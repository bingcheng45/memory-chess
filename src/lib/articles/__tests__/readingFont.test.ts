import { LOCALES } from "@/i18n/routing";
import { readingFaceClass } from "@/lib/articles/readingFont";

jest.mock("next/font/google", () => ({
  Literata: jest.fn(() => ({ className: "literata" })),
}));

const SANS_CLASS = "[font-family:var(--font-geist-sans)]";
const SANS_LOCALES = ["hi", "ja", "ko", "zh-CN", "zh-TW"];
const LITERATA_LOCALES = LOCALES.filter((locale) => !SANS_LOCALES.includes(locale));

describe("readingFaceClass", () => {
  it.each(SANS_LOCALES)("reads %s in the site sans stack, since Literata has no glyphs for it", (locale) => {
    expect(readingFaceClass(locale)).toBe(SANS_CLASS);
  });

  it.each(LITERATA_LOCALES)("reads %s in Literata", (locale) => {
    expect(readingFaceClass(locale)).toBe("literata");
  });

  it.each(["xx", "constructor", ""])("falls back to Literata for the unknown locale %p", (locale) => {
    expect(readingFaceClass(locale)).toBe("literata");
  });
});
