import type { AnchorHTMLAttributes } from "react";
import { render, screen } from "@/test-utils/intl";
import AboutPage, { generateMetadata as aboutMetadata } from "@/app/[locale]/about/page";
import PrivacyPage, { generateMetadata as privacyMetadata } from "@/app/[locale]/privacy/page";
import about from "@/lib/pages/about";
import privacy from "@/lib/pages/privacy";
import readingChrome from "@/lib/pages/readingChrome";
import type { PageText, ReadingChrome } from "@/lib/pages/schema";

jest.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a data-localized href={href} {...props} />,
  usePathname: () => "/privacy",
  useRouter: () => ({ replace: jest.fn() }),
}));
jest.mock("next/navigation", () => ({
  ...jest.requireActual("next/navigation"),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
jest.mock("@/lib/articles/translatedLocales");
jest.mock("@/lib/pages/translatedLocales");

const GERMAN_CHROME: ReadingChrome = {
  contents: "Inhalt",
  onThisPage: "Auf dieser Seite",
  lastUpdated: "Zuletzt geändert: <time>{date}</time>",
  note: {
    general: "Diese Seite wurde mit KI-Unterstützung aus dem Englischen übersetzt.",
    legal: "Diese Übersetzung dient der Bequemlichkeit. Maßgeblich ist die englische Fassung.",
    readInEnglish: "Auf Englisch lesen",
  },
};
const GERMAN: Record<string, PageText> = {
  privacy: { ...privacy, title: "Datenschutzerklärung", meta: { ...privacy.meta, title: "Datenschutz" } },
  about: about,
};

jest.mock("@/lib/pages/load", () => {
  const actual = jest.requireActual("@/lib/pages/load");
  return {
    ...actual,
    loadPage: async (name: string, locale: string) =>
      locale === "de" ? { text: GERMAN[name], chrome: GERMAN_CHROME } : actual.loadPage(name, locale),
  };
});

const IN = (locale: string) => ({ params: Promise.resolve({ locale }) });

describe("a trust page served in German", () => {
  it("says the English version governs, links the English page, and dates itself in German", async () => {
    render(await PrivacyPage(IN("de")));

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Datenschutzerklärung");
    const note = screen.getByText(/Maßgeblich ist die englische Fassung/);
    expect(note).toHaveAttribute("data-translation-note");
    expect(note).toHaveAttribute("data-english-governs");
    expect(screen.getByRole("link", { name: "Auf Englisch lesen" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "Auf Englisch lesen" })).toHaveAttribute("hrefLang", "en");
    expect(screen.getByText("28. Oktober 2026").tagName).toBe("TIME");
    expect(screen.getByRole("navigation", { name: "Auf dieser Seite" })).toBeInTheDocument();
  });

  it("gives the about page the general note, and marks a link to an English-only page as English", async () => {
    render(await AboutPage(IN("de")));

    const note = screen.getByText(/aus dem Englischen übersetzt/);
    expect(note).not.toHaveAttribute("data-english-governs");
    expect(screen.getByRole("link", { name: "Learn library (English)" })).toHaveAttribute("href", "/learn");
    expect(screen.getByRole("link", { name: "Learn library (English)" })).not.toHaveAttribute("data-localized");
    expect(screen.getByRole("link", { name: "privacy policy" })).toHaveAttribute("data-localized");
  });

  it("is noindex, canonical to itself, and names no language alternates", async () => {
    await expect(privacyMetadata(IN("de"))).resolves.toMatchObject({
      title: "Datenschutz",
      alternates: { canonical: "/de/privacy" },
      robots: { index: false, follow: true },
      openGraph: { url: "https://thememorychess.com/de/privacy" },
    });
    expect((await aboutMetadata(IN("de"))).alternates).toEqual({ canonical: "/de/about" });
  });

  it("shows no note in English", async () => {
    const { container } = render(await PrivacyPage(IN("en")));

    expect(container.querySelector("[data-translation-note]")).toBeNull();
    expect(screen.getAllByText(readingChrome.onThisPage).length).toBeGreaterThan(0);
  });

  it("is a 404 in a locale that does not serve it", async () => {
    await expect(PrivacyPage(IN("fr"))).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
