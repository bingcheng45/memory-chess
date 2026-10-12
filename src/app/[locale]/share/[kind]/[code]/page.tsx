import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { LabReadingPage } from "@/components/lab-paper/LabReadingPage";
import { RoundReplay } from "@/components/share/RoundReplay";
import { SharedCard } from "@/components/share/SharedCard";
import { Link } from "@/i18n/navigation";
import { DEFAULT_LOCALE } from "@/i18n/routing";
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

function Card({ page }: { page: SharePage }) {
  return (
    <section className="lab-shared-card" aria-labelledby="lab-shared-card-title">
      <h2 id="lab-shared-card-title">The card that was shared.</h2>
      <SharedCard src={new URL(page.image).pathname} alt={page.alt} />
    </section>
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

function Next({ round }: { round: SharedRound | null }) {
  return (
    <section className="lab-shared-next" aria-labelledby="lab-shared-next-title">
      <h2 id="lab-shared-next-title">Your turn.</h2>
      <p>
        {round
          ? "Play a round at the same setting and see how your memory compares. Free, no sign-up."
          : "Study a chess position for a few seconds, rebuild it from memory, and get your score. Free, no sign-up."}
      </p>
      <div className="lab-shared-actions">
        <Link className="lab-btn lab-btn-primary" href={round ? round.play : "/game"}>
          {round ? "Play the same setting" : "Play Memory Chess"}
        </Link>
        <Link className="lab-btn lab-btn-secondary" href="/">
          How the game works
        </Link>
      </div>
    </section>
  );
}

/** Where a shared card's link lands: the round replayed beside its card when the card has a board, the card alone when not, and a round of one's own. */
export default async function SharePage({ params }: Props) {
  // English-only route: the card's preview is drawn in English, so its page is too.
  setRequestLocale(DEFAULT_LOCALE);
  const { kind, code } = await params;
  const page = sharePageOf(kind, code);
  if (!page) notFound();
  const { round } = page;

  return (
    <LabReadingPage kicker={page.kicker} title={page.title} lede={<span className={ledeFace.className}>{page.caption}</span>}>
      <div className="lab-shared" data-layout={round ? "replay" : "card"}>
        {round ? (
          <>
            <div className="lab-shared-main">
              <RoundReplay round={round} />
              <Figures round={round} />
            </div>
            <div className="lab-shared-aside">
              <Card page={page} />
              <Next round={round} />
            </div>
          </>
        ) : (
          <>
            <Card page={page} />
            <Next round={null} />
          </>
        )}
      </div>
    </LabReadingPage>
  );
}
