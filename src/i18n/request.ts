import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import english from "../../messages/en.json";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;
  const messages = (await import(`../../messages/${locale}.json`)).default;

  return {
    locale,
    // The homepage's `home.lab` copy ships in English first. Until a locale
    // translates it, that locale reads the English block instead of raw keys;
    // its own `home.lab`, once present, wins.
    messages: {
      ...messages,
      home: { lab: english.home.lab, ...messages.home },
    },
  };
});
