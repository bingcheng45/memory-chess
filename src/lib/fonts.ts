import {
  Geist,
  Geist_Mono,
  Noto_Sans,
  Noto_Sans_Devanagari,
} from "next/font/google";
import type { Locale } from "@/i18n/routing";

/**
 * Per-locale fonts.
 *
 * Every loader below writes the same `--font-geist-sans` variable that
 * `globals.css` already consumes, so swapping the font is a class swap on
 * <body> and no component has to know which locale it is rendering.
 */

/**
 * `latin-ext` is not optional. Basic latin has no ğ ş ı (Turkish), ł ż ś ę
 * (Polish), ě š č ř ů (Czech), ő ű (Hungarian) or ă ș ț (Romanian) -- without
 * this subset those glyphs fall back to a system font mid-word, which looks
 * like a rendering bug rather than a design choice.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

const notoSansCyrillic = Noto_Sans({
  variable: "--font-geist-sans",
  subsets: ["cyrillic", "latin"],
  display: "swap",
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-geist-sans",
  subsets: ["devanagari", "latin"],
  display: "swap",
});

/** Vietnamese needs its own subset for the stacked tone marks. */
const notoSansVietnamese = Noto_Sans({
  variable: "--font-geist-sans",
  subsets: ["vietnamese", "latin"],
  display: "swap",
});

/**
 * CJK locales deliberately get no webfont. A CJK face is several megabytes
 * even subsetted, which would blow the LCP budget for exactly the audiences
 * most likely to be on mobile. These classes point `--font-geist-sans` at the
 * platform UI font instead -- which is also what a native-feeling site looks
 * like to those readers. Defined in globals.css.
 */
const CJK_CLASSES: Partial<Record<Locale, string>> = {
  "zh-CN": "font-locale-zh-cn",
  "zh-TW": "font-locale-zh-tw",
  ja: "font-locale-ja",
  ko: "font-locale-ko",
};

export function getSansFontClass(locale: Locale): string {
  const cjk = CJK_CLASSES[locale];
  if (cjk) return cjk;

  switch (locale) {
    case "ru":
      return notoSansCyrillic.variable;
    case "hi":
      return notoSansDevanagari.variable;
    case "vi":
      return notoSansVietnamese.variable;
    default:
      return geistSans.variable;
  }
}
