import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { ViewCount } from "@/components/articles/ArticleCounts";
import ArticleLink from "@/components/articles/ArticleLink";
import ArticleRail from "@/components/articles/ArticleRail";
import ArrivingPortrait from "@/components/articles/ArrivingPortrait";
import EnglishPageLink from "@/components/articles/EnglishPageLink";
import FactFile from "@/components/articles/FactFile";
import LikeButton from "@/components/articles/LikeButton";
import TranslationNote from "@/components/articles/TranslationNote";
import TypedBody from "@/components/articles/TypedBody";
import ViewBeacon from "@/components/articles/ViewBeacon";
import ArticlePaperShell from "@/components/articles/ArticlePaperShell";
import { ARTICLE_LINK, ARTICLE_LONG_WORDS } from "@/components/articles/articleStyles";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { formatArticleDate } from "@/lib/articles/format";
import { articlePath } from "@/lib/articles/paths";
import type {
  Article,
  ArticleDrill,
  ArticleRelatedGuide,
  ArticleSource,
  ArticleSummary,
  PhotoCredit,
} from "@/lib/articles/schema";
import type { ArticleCounts } from "@/lib/articles/stats";
import { buildArticleStructuredData } from "@/lib/articles/structuredData";
import { playHref } from "@/lib/game/roundLink";
import { LEARN_AUTHOR } from "@/lib/seo/learn/schema";
import "./articlePage.css";

type ArticlePageProps = {
  article: Article;
  nextArticle?: ArticleSummary;
  counts?: ArticleCounts;
  /** How fast the body types. A translation's rate is set so it takes as long as the English body. */
  charsPerSecond?: number;
};

const SOURCES_HEADING_ID = "article-sources-heading";
const GUIDES_HEADING_ID = "article-guides-heading";
/** The guides are English-only, so the list of them is shown, and worded, in English only. */
const RELATED_GUIDES_HEADING = "Train it with a guide";
const DRILL_WHY_ID = "article-drill-why";
const NOTE_CLASS = "mt-1 max-w-2xl";
const AUTHOR_PATH = new URL(LEARN_AUTHOR.url).pathname;

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={ARTICLE_LINK}>
      {children}
    </a>
  );
}

function Credit({ credit }: { credit: PhotoCredit }) {
  const t = useTranslations("articles.page");
  const { author, license, licenseUrl, sourceUrl, changes } = credit;

  return (
    <cite className="art-credit mt-2 block not-italic">
      {t.rich("photoCredit", {
        author,
        license,
        changes,
        licenseLink: (name) => (licenseUrl === null ? name : <ExternalLink href={licenseUrl}>{name}</ExternalLink>),
        source: (name) => <ExternalLink href={sourceUrl}>{name}</ExternalLink>,
      })}
    </cite>
  );
}

function Portrait({ article }: { article: Article }) {
  const { slug, photo, person } = article;
  const { src, width, height, alt } = photo;

  return (
    <figure className="row-start-1 mb-[22px] max-w-[190px] min-[821px]:mb-0 min-[821px]:max-w-none">
      <ArrivingPortrait key={slug} slug={slug} photo={{ src, width, height, alt }} />
      <figcaption className={`art-figcap mt-3 ${ARTICLE_LONG_WORDS}`}>
        <b className="block">{person.name}</b>
        <span>{person.role}</span>
        <Credit credit={photo} />
      </figcaption>
    </figure>
  );
}

function HeadingBlock({ article, counts }: Pick<ArticlePageProps, "article" | "counts">) {
  const t = useTranslations("articles.page");
  const locale = useLocale();

  return (
    <header className="row-start-2 min-[821px]:col-start-2 min-[821px]:row-start-1">
      <p className="art-meta">
        <time dateTime={article.publishedAt} data-flight="date" className="inline-block">
          {formatArticleDate(article.publishedAt, locale)}
        </time>
      </p>
      <h1
        data-flight="title"
        className={`art-h1 mt-3 [text-wrap:balance] ${ARTICLE_LONG_WORDS}`}
      >
        {article.title}
      </h1>
      <p className="art-lede mt-4 max-w-[58ch]">{article.description}</p>
      <div className="art-note mt-5">
        <address data-article-byline className="not-italic">
          {t.rich("byline", {
            name: LEARN_AUTHOR.name,
            author: (name) => <EnglishPageLink href={AUTHOR_PATH}>{name}</EnglishPageLink>,
          })}
        </address>
        <p data-authorship-note className={NOTE_CLASS}>
          {t("authorshipNote")}
        </p>
        <TranslationNote englishPath={articlePath(article.slug)} className={NOTE_CLASS} />
      </div>
      <div
        data-article-counts
        className="art-counts mt-5 flex flex-wrap items-center gap-x-[18px] gap-y-2.5"
      >
        <ViewCount count={counts?.views} />
        <LikeButton key={article.slug} slug={article.slug} likes={counts?.likes} />
      </div>
    </header>
  );
}

function Drill({ drill }: { drill: ArticleDrill }) {
  const t = useTranslations("articles.page");
  const action = t("drillAction", { pieces: drill.pieceCount, seconds: drill.memorizeTime });

  return (
    <aside className="mt-10 max-w-[720px]">
      <Link
        href={playHref(drill.pieceCount, drill.memorizeTime, "article_cta")}
        data-article-drill
        aria-label={action}
        aria-describedby={DRILL_WHY_ID}
        className="art-drill group flex flex-wrap items-center justify-between gap-4 p-6"
      >
        <span className="art-drill-text min-w-0 flex-[1_1_260px]">
          <b>{t("drillHeading")}</b>
          <span id={DRILL_WHY_ID}>{drill.why}</span>
        </span>
        <span className="art-drill-btn inline-flex min-h-11 items-center px-5">
          {action}
        </span>
      </Link>
    </aside>
  );
}

/**
 * English-only, so it adds no h2, p or li: a translation has no such block,
 * and the AdSense audit counts those against the English page.
 */
function RelatedGuides({ guides }: { guides: readonly ArticleRelatedGuide[] }) {
  return (
    <nav aria-labelledby={GUIDES_HEADING_ID} className="art-after">
      <span id={GUIDES_HEADING_ID} className="art-after-h">
        {RELATED_GUIDES_HEADING}
      </span>
      <div className="art-prose mt-4 space-y-2">
        {guides.map((guide) => (
          // The anchor is written to read inside a sentence, so only its
          // first letter is raised for the list.
          <Link key={guide.slug} href={`/learn/${guide.slug}`} className={`${ARTICLE_LINK} block first-letter:uppercase`}>
            {guide.anchor}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function Sources({ sources }: { sources: readonly ArticleSource[] }) {
  const t = useTranslations("articles.page");
  const titleLang = useLocale() === DEFAULT_LOCALE ? undefined : DEFAULT_LOCALE;

  return (
    <section aria-labelledby={SOURCES_HEADING_ID} className="art-after">
      <h2 id={SOURCES_HEADING_ID} className="art-after-h">
        {t("sources")}
      </h2>
      <ol className="art-sources mt-4">
        {sources.map((source) => (
          <li key={source.url} className="py-4">
            <cite lang={titleLang} className="not-italic">
              <ExternalLink href={source.url}>{source.title}</ExternalLink>
            </cite>
            <p className="art-note mt-2">{source.note}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function NextArticle({ next }: { next: ArticleSummary }) {
  const t = useTranslations("articles.page");

  return (
    <ArticleLink
      article={next.slug}
      portrait={next.photo}
      className="art-next group mt-8 block pt-6"
    >
      {t("nextArticle")}
      <b className="art-next-title mt-1 block">
        {next.title}
      </b>
    </ArticleLink>
  );
}

export default function ArticlePage({ article, nextArticle, counts, charsPerSecond }: ArticlePageProps) {
  const t = useTranslations("articles");
  const locale = useLocale();
  const structuredData = buildArticleStructuredData(article, locale, t("list.heading"));

  return (
    <ArticlePaperShell layout="article">
      <ArticleLink
        backFrom={article.slug}
        className="art-back mb-4 mt-8 inline-flex min-h-11 items-center gap-2"
      >
        <span aria-hidden="true">←</span>
        {t("page.backToList")}
      </ArticleLink>
      <article
        data-article-flight=""
        className="grid grid-cols-[minmax(0,1fr)] min-[821px]:grid-cols-[280px_minmax(0,1fr)] min-[821px]:items-start min-[821px]:gap-x-14"
      >
        <HeadingBlock article={article} counts={counts} />
        <ArticleRail>
          <Portrait article={article} />
          <FactFile facts={article.facts} className="row-start-3 mt-7 min-[821px]:mt-[22px]" />
        </ArticleRail>
        <div className="row-start-4 min-[821px]:col-start-2 min-[821px]:row-start-2">
          <TypedBody
            key={article.slug}
            slug={article.slug}
            sections={article.sections}
            charsPerSecond={charsPerSecond}
          />
          <Drill drill={article.drill} />
          {article.relatedGuides?.length ? (
            <RelatedGuides guides={article.relatedGuides} />
          ) : null}
          <Sources sources={article.sources} />
          {nextArticle ? <NextArticle next={nextArticle} /> : null}
        </div>
      </article>
      <ViewBeacon slug={article.slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </ArticlePaperShell>
  );
}
