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
    <section aria-labelledby="leaderboard-reference-title" className="lb-ref">
      <div className="lab-wrap">
        <div className="lb-ref-body">
          <h2 id="leaderboard-reference-title">{prose.heading}</h2>
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
    </section>
  );
}
