import NextLink from "next/link";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/routing";
import type { LoadedPage } from "@/lib/pages/load";
import { PAGES } from "@/lib/pages/registry";
import type { Block } from "@/lib/pages/schema";
import type { PageName } from "@/lib/pages/translatedLocales";
import { englishOnlyLinkSuffix, isServedAtBareEnglishUrl } from "@/lib/seo/englishOnly";
import { LabReadingPage, LabReadingSection } from "./LabReadingPage";
import { richText } from "./richText";

interface TextLinkProps {
  readonly href: string;
  readonly locale: Locale;
  readonly children: ReactNode;
}

// A page of the site this locale does not serve is linked at its bare English URL and says so, as SiteLink does.
function TextLink({ href, locale, children }: TextLinkProps) {
  if (href.startsWith("https:")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  if (!href.startsWith("/")) return <a href={href}>{children}</a>;
  if (locale !== DEFAULT_LOCALE && isServedAtBareEnglishUrl(href, locale)) {
    return (
      <NextLink href={href} hrefLang={DEFAULT_LOCALE}>
        {children}
        {englishOnlyLinkSuffix(locale)}
      </NextLink>
    );
  }
  return <Link href={href}>{children}</Link>;
}

const bold = (chunks: ReactNode) => <strong>{chunks}</strong>;

function BlockOf({ block, render }: { readonly block: Block; readonly render: (message: string) => ReactNode }) {
  if ("p" in block) return <p>{render(block.p)}</p>;
  return (
    <ul>
      {block.ul.map((item, index) => (
        <li key={index}>{render(item)}</li>
      ))}
    </ul>
  );
}

interface TrustPageProps {
  readonly name: PageName;
  readonly locale: Locale;
  /** What `loadPage` returned for this name and locale. */
  readonly page: LoadedPage;
}

/** A trust page in `locale`: its text and chrome as loaded, its links and values from the page registry. */
export function TrustPage({ name, locale, page: { text, chrome } }: TrustPageProps) {
  const spec = PAGES[name];
  const links = Object.entries(spec.links).map(([tag, href]) => {
    const link = (chunks: ReactNode) => (
      <TextLink href={href} locale={locale}>
        {chunks}
      </TextLink>
    );
    return [tag, link] as const;
  });
  const values = { ...spec.values, ...Object.fromEntries(links), b: bold };
  const render = (message: string) => richText(message, locale, values);
  const sections = Object.entries(text.sections);

  return (
    <LabReadingPage
      locale={locale}
      chrome={chrome}
      kicker={text.kicker}
      title={text.title}
      lede={render(text.lede)}
      contents={spec.hasContents ? sections.map(([id, section]) => ({ id, title: section.title })) : undefined}
      updated={spec.updated}
    >
      {sections.map(([id, section]) => (
        <LabReadingSection key={id} title={section.title} id={spec.hasContents ? id : undefined}>
          {section.blocks.map((block, index) => (
            <BlockOf key={index} block={block} render={render} />
          ))}
        </LabReadingSection>
      ))}
    </LabReadingPage>
  );
}
