import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LabPaperHeader } from "@/components/lab-paper/LabPaperHeader";
import { LAB_PAPER_CLASS } from "@/components/lab-paper/shell";
import LearnSearchBeacon from "@/components/learn/LearnSearchBeacon";
import GuideTranslations from "@/components/learn/GuideTranslations";
import LearnSearchResult from "@/components/learn/LearnSearchResult";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { EN_LEARN_PAGES, groupPages } from "@/lib/seo/learn";
import { LEARN_HUB_COPY, LEARN_SEARCH_COPY as COPY } from "@/lib/seo/learn/copy";
import { LEARN_SEARCH_PATH, groupAnchor, guideRoundHref, learnSearchHref } from "@/lib/seo/learn/links";
import { outcomeOf, prepareIndex, search } from "@/lib/seo/learn/search";
import { learnSearchDocs } from "@/lib/seo/learn/searchDocs";
import "@/components/learn/learn.css";

const INDEX = prepareIndex(learnSearchDocs({ withBody: true }));
const NO_RESULT_ROUND = { pieceCount: 6, memorizeTime: 10 } as const;
const MAX_QUERY_LENGTH = 120;

export const metadata: Metadata = {
  title: COPY.serverTitle,
  description: LEARN_HUB_COPY.meta.description,
  alternates: { canonical: LEARN_SEARCH_PATH },
  robots: { index: false, follow: true },
};

type LearnSearchRouteProps = { searchParams: Promise<{ q?: string | string[] }> };

function StageLinks() {
  return (
    <ul className="ls-stages">
      {groupPages(EN_LEARN_PAGES).map(({ group }) => (
        <li key={group.id}>
          <Link href={groupAnchor(group.id)}>{group.label}</Link>
        </li>
      ))}
    </ul>
  );
}

/** Learn search without JavaScript: the hub's form submits here, and the same ranker runs on the server. */
export default async function LearnSearchRoute({ searchParams }: LearnSearchRouteProps) {
  setRequestLocale(DEFAULT_LOCALE);
  const raw = (await searchParams).q;
  const query = (Array.isArray(raw) ? raw[0] : raw ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  const results = query ? search(query, INDEX) : [];
  const outcome = outcomeOf(results);
  const asked = EN_LEARN_PAGES.filter((page) => page.meta.featured).map((page) => page.meta.questions[0]);

  return (
    <div className={LAB_PAPER_CLASS}>
      <LabPaperHeader />
      <main className="lab-wrap ls-page">
        <header className="lh-head">
          <p className="lab-kicker">
            <Link href="/learn">{LEARN_HUB_COPY.kicker}</Link>
          </p>
          <h1>{COPY.serverTitle}</h1>
          <p className="lab-lede">{COPY.serverLede}</p>
        </header>
        <form className="ls-form" role="search" method="get" action={LEARN_SEARCH_PATH}>
          <label htmlFor="learn-search-q" className="ls-label">
            {COPY.label}
          </label>
          <div className="ls-field">
            <input id="learn-search-q" name="q" type="search" defaultValue={query} placeholder={COPY.placeholder} autoComplete="off" />
            <button type="submit" className="ls-submit">
              {COPY.submit}
            </button>
          </div>
        </form>

        {query === "" ? (
          <section className="ls-section" aria-labelledby="ls-ask-h">
            <h2 id="ls-ask-h">{COPY.peopleAsk}</h2>
            <ul className="ls-asked">
              {asked.map((question) => (
                <li key={question}>
                  <Link href={learnSearchHref(question)}>{question}</Link>
                </li>
              ))}
            </ul>
            <p className="ls-section-label">{COPY.stages}</p>
            <StageLinks />
          </section>
        ) : outcome === "none" ? (
          <section className="ls-section" aria-labelledby="ls-none-h">
            <h2 id="ls-none-h">{COPY.none(query)}</h2>
            <p className="ls-none-hint">{COPY.noneHint}</p>
            <StageLinks />
            <p>
              <Link href={guideRoundHref(NO_RESULT_ROUND)} className="lab-btn lab-btn-primary">
                {COPY.playRound}
              </Link>
            </p>
          </section>
        ) : (
          <section className="ls-section" aria-labelledby="ls-results-h">
            <h2 id="ls-results-h">{COPY.serverResults(query)}</h2>
            <p className="ls-section-label">{outcome === "weak" ? COPY.closest : COPY.results}</p>
            <ol className="ls-results">
              {results.map((result, rank) => (
                <li key={result.slug}>
                  <Link
                    href={result.url}
                    className="ls-option"
                    data-search-rank={rank + 1}
                    data-search-slug={result.slug}
                    data-search-matched={result.matchedQuestion !== null}
                  >
                    <LearnSearchResult result={result} query={query} />
                  </Link>
                  {result.kind === "guide" ? <GuideTranslations slug={result.slug} /> : null}
                </li>
              ))}
            </ol>
          </section>
        )}
      </main>
      {query ? (
        <LearnSearchBeacon queryLength={query.length} results={results.length} top={results[0]?.slug ?? "none"} outcome={outcome} />
      ) : null}
    </div>
  );
}
