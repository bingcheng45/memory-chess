import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { LabReadingPage } from "@/components/lab-paper/LabReadingPage";
import { RoundReplay } from "@/components/share/RoundReplay";
import { Link } from "@/i18n/navigation";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { PREVIEW_SIZE } from "@/lib/share/previewSize";
import { sharePageMetadata, sharePageOf, type SharePage, type SharedRound } from "@/lib/share/sharePage";
import "./share-page.css";

type Props = { params: Promise<{ kind: string; code: string }> };

/**
 * The shell's body face is not preloaded, and a caption that fits one line in Open Sans can take two in its fallback,
 * so the swap would pull the replay up under the reader. Set in a preloaded copy of the face, the lede paints once.
 */
const ledeFace = Open_Sans({ subsets: ["latin"], display: "swap" });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kind, code } = await params;
  const page = sharePageOf(kind, code);
  if (!page || (kind !== "progress" && kind !== "result")) notFound();
  return sharePageMetadata(kind, code, page);
}

function Card({ page, small }: { page: SharePage; small: boolean }) {
  return (
    <figure className="lab-shared-card" data-small={small || undefined}>
      {small && <figcaption>The card that was shared</figcaption>}
      <div className="lab-shared-card-frame">
        {/* eslint-disable-next-line @next/next/no-img-element -- the preview is a drawn PNG served immutable from its own route */}
        <img src={new URL(page.image).pathname} alt={page.alt} {...PREVIEW_SIZE} />
      </div>
    </figure>
  );
}

function Figures({ round }: { round: SharedRound }) {
  return (
    <section className="lab-shared-figures" aria-labelledby="lab-shared-figures-title">
      <h2 id="lab-shared-figures-title">The figures.</h2>
      <dl>
        {round.figures.map(({ label, value }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Where a shared card's link lands: the round replayed when its card has a board, the card, and a round of one's own. */
export default async function SharePage({ params }: Props) {
  // English-only route: the card's preview is drawn in English, so its page is too.
  setRequestLocale(DEFAULT_LOCALE);
  const { kind, code } = await params;
  const page = sharePageOf(kind, code);
  if (!page) notFound();
  const { round } = page;

  return (
    <LabReadingPage kicker={page.kicker} title={page.title} lede={<span className={ledeFace.className}>{page.caption}</span>}>
      {round ? <RoundReplay round={round} /> : <Card page={page} small={false} />}
      {round && <Figures round={round} />}
      <div className="lab-shared-actions">
        <Link className="lab-btn lab-btn-primary" href={round ? round.play : "/game"}>
          {round ? "Play the same setting" : "Play Memory Chess"}
        </Link>
        <Link className="lab-btn lab-btn-secondary" href="/">
          How the game works
        </Link>
      </div>
      {round && <Card page={page} small />}
    </LabReadingPage>
  );
}
