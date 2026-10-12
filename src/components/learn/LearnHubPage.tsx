import { Link } from "@/i18n/navigation";
import { LabPaperHeader } from "@/components/lab-paper/LabPaperHeader";
import { LAB_PAPER_CLASS } from "@/components/lab-paper/shell";
import type { LearnGroupPages } from "@/lib/seo/learn";
import { LEARN_GUIDE_COPY, LEARN_HUB_COPY as COPY } from "@/lib/seo/learn/copy";
import { guidePath } from "@/lib/seo/learn/links";
import { hubStructuredData } from "@/lib/seo/learn/structuredData";
import "./learn.css";

export default function LearnHubPage({ groups }: { readonly groups: readonly LearnGroupPages[] }) {
  const pages = groups.flatMap((entry) => entry.pages);

  return (
    <div className={LAB_PAPER_CLASS}>
      <LabPaperHeader />
      <main className="lab-wrap lg-hub">
        <header className="lg-hub-head">
          <p className="lab-kicker">{COPY.kicker}</p>
          <h1>{COPY.title}</h1>
          <p className="lab-lede">{COPY.lede}</p>
        </header>
        {groups.map(({ group, pages: inGroup }) => (
          <section key={group.id} id={group.id} className="lg-hub-group" aria-labelledby={`${group.id}-h`}>
            <h2 id={`${group.id}-h`}>{group.label}</h2>
            <p className="lg-hub-group-desc">
              {group.description} <span className="lg-hub-count">{COPY.guideCount(inGroup.length)}</span>
            </p>
            <ol className="lg-hub-list">
              {inGroup.map((page) => (
                <li key={page.meta.slug}>
                  <Link href={guidePath(page.meta.slug)} className="lg-hub-card">
                    <b>{page.meta.title}</b>
                    <span>{page.meta.description}</span>
                    <span className="lg-hub-card-meta">{LEARN_GUIDE_COPY.minRead(page.readingMinutes)}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(hubStructuredData(pages, COPY.meta.title, COPY.meta.description)),
        }}
      />
    </div>
  );
}
