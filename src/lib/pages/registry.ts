import { EN_LEARN_PAGES } from "@/lib/seo/learn";
import { PRIVACY_LAST_UPDATED } from "@/lib/seo/privacyPolicy";
import { TERMS_LAST_UPDATED } from "@/lib/seo/termsOfService";
import about from "./about";
import privacy from "./privacy";
import terms from "./terms";
import type { PageText } from "./schema";
import type { PageName } from "./translatedLocales";

export const CONTACT_EMAIL = "bingcheng45@gmail.com";

/** What a trust page's text cannot carry: where each rich tag links, the values it prints, and how it is laid out. */
export interface PageSpec {
  readonly route: `/${PageName}`;
  readonly english: PageText;
  /** Tag name to href. A path starting with `/` is a page of the site, an `https:` URL opens in a new tab. */
  readonly links: Readonly<Record<string, string>>;
  readonly values: Readonly<Record<string, string | number>>;
  /** Whether the page lists its sections under the lede and gives each an anchor. */
  readonly hasContents: boolean;
  readonly updated?: string;
}

const MAILTO = `mailto:${CONTACT_EMAIL}`;
const VALUES = { email: CONTACT_EMAIL };

export const PAGES: Readonly<Record<PageName, PageSpec>> = {
  about: {
    route: "/about",
    english: about,
    links: {
      tont: "https://tont.app",
      x: "https://x.com/TheMemoryChess",
      game: "/game",
      learn: "/learn",
      changelog: "/changelog",
      contact: "/contact-us",
      privacy: "/privacy",
      terms: "/terms",
      mail: MAILTO,
    },
    values: { ...VALUES, count: EN_LEARN_PAGES.length },
    hasContents: false,
  },
  privacy: {
    route: "/privacy",
    english: privacy,
    links: {
      partnerSites: "https://policies.google.com/technologies/partner-sites",
      adCenter: "https://myadcenter.google.com/",
      adChoices: "https://optout.aboutads.info/",
      data: "/data",
      contact: "/contact-us",
      mail: MAILTO,
    },
    values: VALUES,
    hasContents: true,
    updated: PRIVACY_LAST_UPDATED,
  },
  terms: {
    route: "/terms",
    english: terms,
    links: { privacy: "/privacy", mail: MAILTO },
    values: VALUES,
    hasContents: true,
    updated: TERMS_LAST_UPDATED,
  },
};
