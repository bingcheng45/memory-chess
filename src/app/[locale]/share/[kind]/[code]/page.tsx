import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { LabReadingPage } from "@/components/lab-paper/LabReadingPage";
import { Link } from "@/i18n/navigation";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { PREVIEW_SIZE } from "@/lib/share/previewSize";
import { sharePageMetadata, sharePageOf } from "@/lib/share/sharePage";
import "./share-page.css";

type Props = { params: Promise<{ kind: string; code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kind, code } = await params;
  const page = sharePageOf(kind, code);
  if (!page || (kind !== "progress" && kind !== "result")) notFound();
  return sharePageMetadata(kind, code, page);
}

/** Where a shared card's link lands: the card, what it says, and the way into a round of one's own. */
export default async function SharePage({ params }: Props) {
  // English-only route: the card's preview is drawn in English, so its page is too.
  setRequestLocale(DEFAULT_LOCALE);
  const { kind, code } = await params;
  const page = sharePageOf(kind, code);
  if (!page) notFound();

  return (
    <LabReadingPage kicker={page.kicker} title={page.title} lede={page.caption}>
      <figure className="lab-shared-card">
        {/* eslint-disable-next-line @next/next/no-img-element -- the preview is a drawn PNG served immutable from its own route */}
        <img src={new URL(page.image).pathname} alt={page.alt} {...PREVIEW_SIZE} />
      </figure>
      <div className="lab-shared-actions">
        <Link className="lab-btn lab-btn-primary" href="/game">
          Play Memory Chess
        </Link>
        <Link className="lab-btn lab-btn-secondary" href="/">
          How the game works
        </Link>
      </div>
    </LabReadingPage>
  );
}
