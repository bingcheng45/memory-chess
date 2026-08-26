import {
  Geist,
  Geist_Mono,
  Noto_Sans,
  Noto_Sans_Devanagari,
} from "next/font/google";
import type { Locale } from "@/i18n/routing";

/**
 * Geist ships `latin` and `latin-ext` only. Rendering Cyrillic, Devanagari or
 * CJK in it silently falls back to whatever the OS provides, which reads as
 * broken next to the rest of the design -- so the non-Latin locales get a font
 * that actually covers their script.
 *
 * Every loader below writes the same `--font-geist-sans` variable that
 * `globals.css` already consumes, so swapping the font is a class swap on
 * <body> and no component has to know which locale it is rendering.
 */

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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

/**
 * Simplified Chinese deliberately gets no webfont. A CJK webfont is several
 * megabytes even subsetted, which would blow the LCP budget for the one locale
 * whose users are most likely on mobile. `.font-locale-cjk` in globals.css
 * points `--font-geist-sans` at the platform UI font instead, which is what
 * Chinese users expect a native-feeling site to look like anyway.
 */
const CJK_FALLBACK_CLASS = "font-locale-cjk";

export function getSansFontClass(locale: Locale): string {
  switch (locale) {
    case "ru":
      return notoSansCyrillic.variable;
    case "hi":
      return notoSansDevanagari.variable;
    case "zh-CN":
      return CJK_FALLBACK_CLASS;
    default:
      return geistSans.variable;
  }
}
