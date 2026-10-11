import { Open_Sans } from "next/font/google";

/**
 * Lab Paper's body face. Declared here rather than in src/lib/fonts.ts so only the English homepage, the one page
 * that sets body text in it, loads it; the locale layout's module would put it on every page.
 */
export const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  display: "swap",
});
