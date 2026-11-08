/** @jest-environment node */
import type { AnchorHTMLAttributes } from "react";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import Home from "@/app/[locale]/(home)/page";
import { QUICK_START_HREF } from "@/components/home/links";
import messages from "../../../../../messages/en.json";

/**
 * Google indexes the phone view first. On an English phone the home page opens on the still Najdorf screen
 * (IntroFirstScreen) with the hero below it, so the served HTML must still carry the hero's one h1, visible.
 */

let mockHomeIntro = false;
jest.mock("@/lib/home/intro/introGate", () => ({
  ...jest.requireActual("@/lib/home/intro/introGate"),
  get HOME_INTRO() {
    return mockHomeIntro;
  },
}));

jest.mock("next-intl/server", () => ({ ...jest.requireActual("next-intl/server"), setRequestLocale: jest.fn() }));
jest.mock("@/lib/services/totalPlays", () => ({ getTotalPlays: async () => null }));
jest.mock("@/lib/articles/translatedLocales");

jest.mock("@/i18n/navigation", () => ({
  Link: (props: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => {
    const anchor = { ...props };
    delete anchor.prefetch;
    return <a {...anchor} />;
  },
  usePathname: () => "/",
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("next/link", () => {
  function MockNextLink(props: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) {
    const anchor = { ...props };
    delete anchor.prefetch;
    return <a {...anchor} />;
  }
  return MockNextLink;
});

// The switcher needs a mounted app router, which a server render in a test does not have.
jest.mock("@/components/ui/LanguageSettings", () => function MockLanguageSettings() {
  return null;
});

const decode = (markup: string) =>
  markup.replace(/<[^>]+>/g, "").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

async function serveHome(homeIntro: boolean): Promise<string> {
  mockHomeIntro = homeIntro;
  const page = await Home({ params: Promise.resolve({ locale: "en" }) });
  return renderToString(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      {page}
    </NextIntlClientProvider>,
  ).replace(/<!-- -->/g, "");
}

const links = (markup: string) =>
  Array.from(markup.matchAll(/<a\b([^>]*)>(.*?)<\/a>/g), ([, attributes, text]) => ({
    href: decode(attributes.match(/\bhref="([^"]*)"/)?.[1] ?? ""),
    text: decode(text),
  }));

/**
 * The h1 and every element around it: html and body as src/app/[locale]/layout.tsx serves them, the rest as the markup
 * test below pins them, with no attribute but their class.
 */
const HERO_CHAIN: readonly { readonly tag: string; readonly classes: readonly string[]; readonly attributes?: readonly string[] }[] = [
  { tag: "html", classes: [], attributes: ["lang"] },
  { tag: "body", classes: ["min-h-screen", "bg-bg-dark", "text-text-primary", "antialiased"] },
  { tag: "div", classes: ["lab-paper"] },
  { tag: "main", classes: [] },
  { tag: "section", classes: ["lab-hero"] },
  { tag: "div", classes: ["lab-wrap"] },
  { tag: "div", classes: [] },
  { tag: "h1", classes: [] },
  { tag: "span", classes: ["lab-seo-title"] },
  { tag: "span", classes: ["lab-display"] },
];

/** Hidden outright, or clipped away the way a visually hidden heading is (src/components/game/game-lab.css). */
const HIDES =
  /(?:^|;)\s*(?:display\s*:\s*none|(?:content-)?visibility\s*:\s*hidden|clip-path\s*:\s*inset\(\s*50%|clip\s*:\s*rect\()/;

/** Every innermost rule in every stylesheet under src, media queries included, with comments removed. */
function hidingSelectors(): string[] {
  const root = join(process.cwd(), "src");
  return (readdirSync(root, { recursive: true }) as string[])
    .filter((file) => file.endsWith(".css"))
    .flatMap((file) =>
      Array.from(
        readFileSync(join(root, file), "utf8")
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .matchAll(/([^{}]+)\{([^{}]*)\}/g),
      )
        .filter(([, , body]) => HIDES.test(body.trim()))
        .flatMap(([, selector]) => selector.replace(/\([^)]*\)/g, "()").split(","))
        .map((selector) => `${file}: ${selector.trim()}`),
    );
}

/** Whether the selector's subject, its last compound, could be one of the hero's elements. */
function couldHideHero(entry: string): boolean {
  const subject = entry.slice(entry.indexOf(": ") + 2).split(/\s*[\s>+~]\s*/).pop() ?? "";
  // A pseudo-element hides only itself, none of the hero's elements carries an id, and a keyframe step ("50%") is no
  // selector.
  if (/::|#|^\d/.test(subject)) return false;
  const tag = subject.match(/^(?:[a-z][\w-]*|\*)/i)?.[0];
  const classes = Array.from(subject.matchAll(/\.([\w-]+)/g), ([, name]) => name);
  const attributes = Array.from(subject.matchAll(/\[([\w-]+)/g), ([, name]) => name);
  return HERO_CHAIN.some(
    (element) =>
      (!tag || tag === "*" || tag === element.tag) &&
      classes.every((name) => element.classes.includes(name)) &&
      attributes.every((name) => element.attributes?.includes(name)),
  );
}

describe.each([false, true])("the English home page served to a phone, intro flag %s", (homeIntro) => {
  let markup = "";
  beforeAll(async () => {
    markup = await serveHome(homeIntro);
  });

  it("serves the phone first screen, with the hero after it", () => {
    const firstScreen = markup.indexOf('<section class="home-first"');

    expect(firstScreen).toBeGreaterThan(-1);
    expect(markup.indexOf('<section class="lab-hero">')).toBeGreaterThan(firstScreen);
  });

  it("serves exactly one h1, in the hero, in the HTML itself", () => {
    expect(markup.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(markup.indexOf("<h1")).toBeGreaterThan(markup.indexOf('<section class="lab-hero">'));
  });

  it("names Memory Chess and the chess memory trainer in the h1, with the free promise around it", () => {
    const [h1] = Array.from(markup.matchAll(/<h1[^>]*>(.*?)<\/h1>/g), ([, inner]) => decode(inner));
    const lede = decode(markup.match(/<\/h1><p class="lab-lede">(.*?)<\/p>/)?.[1] ?? "");

    expect(h1).toMatch(/memory chess/i);
    expect(h1).toContain("chess memory trainer");
    expect(markup).toContain('<div class="lab-eyebrow"><span class="lab-tag lab-tag-accent">Free · no account</span>');
    expect(lede).toContain("Memory Chess is a free memory chess game and chess memory trainer.");
  });

  it("puts no hidden attribute, inline style or extra class on the h1 or the elements around it", () => {
    expect(markup).toMatch(/<div class="lab-paper[^"]*">/);
    expect(markup).toContain("<main>");
    expect(markup).toContain('<section class="lab-hero"><div class="lab-wrap"><div><div class="lab-eyebrow">');
    expect(markup).toContain('<h1><span class="lab-seo-title">');
    expect(markup).toContain('<span class="lab-display">');
  });

  it("serves Play and the links to /game, /daily and /learn", () => {
    const served = links(markup);

    expect(served).toContainEqual({ href: QUICK_START_HREF, text: "Play a free round" });
    expect(served.map((link) => link.href)).toEqual(expect.arrayContaining(["/game", "/daily", "/learn"]));
  });
});

describe("the stylesheets, phone media queries included", () => {
  it("hide none of the h1 or the elements around it", () => {
    const selectors = hidingSelectors();

    expect(selectors.length).toBeGreaterThan(0);
    expect(selectors.filter(couldHideHero)).toEqual([]);
  });
});
