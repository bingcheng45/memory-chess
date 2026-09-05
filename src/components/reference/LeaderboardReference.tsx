import { EDITORIAL_STYLES } from "@/components/editorial/editorialStyles";
import { LEADERBOARD_ROW_LIMIT } from "@/lib/reference/facts";
import { getReferenceProse, interpolate } from "@/lib/reference/prose";

/**
 * Rendered by the leaderboard route's layout: the page wraps its content in a
 * Suspense boundary whose child calls useSearchParams, so during static
 * prerender only the loading fallback reaches the served HTML. An explainer
 * only; serving real rows was considered and rejected because it couples page
 * rendering to database uptime for a modest content gain.
 */
export default function LeaderboardReference({ locale }: { locale: string }) {
  const prose = getReferenceProse(locale).leaderboard;

  return (
    <section
      aria-labelledby="leaderboard-reference-title"
      className="bg-bg-dark text-text-primary"
    >
      <div className="container mx-auto max-w-4xl px-1 sm:px-4 pb-4 pt-6">
        <div
          className={`${EDITORIAL_STYLES.readingColumn} border-t border-white/10 pt-10`}
        >
          <h2
            id="leaderboard-reference-title"
            className={EDITORIAL_STYLES.sectionTitle}
          >
            {prose.heading}
          </h2>
          <div className={`${EDITORIAL_STYLES.body} mt-5 space-y-4`}>
            <p>{prose.body}</p>
            <p>{prose.order}</p>
            <p>{prose.columnsNote}</p>
            <p>
              {interpolate(prose.sectionIntro, {
                limit: LEADERBOARD_ROW_LIMIT,
              })}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
