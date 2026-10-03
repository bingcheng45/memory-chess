import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import ArticleList from "@/components/articles/ArticleList";
import { ARTICLE_LINK } from "@/components/articles/articleStyles";
import { EditorialPageShell } from "@/components/editorial/EditorialPage";
import { Link } from "@/i18n/navigation";
import { ARTICLE_SUMMARIES } from "@/lib/articles";
import { ARTICLE_LIST_COPY } from "@/lib/articles/copy";
import { buildArticleListStructuredData } from "@/lib/articles/structuredData";
import { buildArticleListMetadata } from "@/lib/seo/articleMetadata";

const ABOUT_HEADING_ID = "articles-about-heading";
const ABOUT_PARAGRAPH_CLASS = "mt-4 text-base leading-7 text-text-secondary";

export function generateMetadata(): Metadata {
  return buildArticleListMetadata(ARTICLE_SUMMARIES[0]);
}

function About() {
  const { about } = ARTICLE_LIST_COPY;

  return (
    <section
      aria-labelledby={ABOUT_HEADING_ID}
      className="mt-14 max-w-[66ch] border-t border-white/10 pt-10"
    >
      <h2 id={ABOUT_HEADING_ID} className="text-xl font-semibold tracking-tight text-white">
        {about.heading}
      </h2>
      {about.paragraphs.map((paragraph) => (
        <p key={paragraph} className={ABOUT_PARAGRAPH_CLASS}>
          {paragraph}
        </p>
      ))}
      <p className={ABOUT_PARAGRAPH_CLASS}>
        {about.corrections.text}{" "}
        <Link href={about.corrections.href} className={ARTICLE_LINK}>
          {about.corrections.linkLabel}
        </Link>
      </p>
    </section>
  );
}

export default async function ArticlesPage({ params }: { params: Promise<{ locale: string }> }) {
  // Without this next-intl reads the locale from the request headers, and a
  // page that reads headers is rendered on every request instead of at build.
  setRequestLocale((await params).locale);

  return (
    <EditorialPageShell>
      <header className="mb-[26px] mt-[22px]">
        <h1 className="text-[clamp(30px,5vw,44px)] font-bold leading-[1.05] tracking-[-0.02em] text-white">
          {ARTICLE_LIST_COPY.heading}
        </h1>
        <p className="mt-2 text-text-muted">{ARTICLE_LIST_COPY.sub}</p>
      </header>
      <ArticleList articles={ARTICLE_SUMMARIES} />
      <About />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildArticleListStructuredData(ARTICLE_SUMMARIES)),
        }}
      />
    </EditorialPageShell>
  );
}
