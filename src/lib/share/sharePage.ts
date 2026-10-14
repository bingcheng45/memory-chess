import type { Metadata } from "next";
import type { RoundShare } from "@/components/game/roundShare";
import { shareImageUrl } from "@/components/share/shareLink";
import { playHref } from "@/lib/game/roundLink";
import { progressPreview, resultPreview, type ResultPreview } from "./cardCopy";
import { PREVIEW_SIZE } from "./previewSize";
import type { ReplayRound } from "./replay";
import { parseProgress, parseResult, type ShareKind } from "./shareCode";

const SITE_URL = "https://thememorychess.com";
const DESCRIPTION = "Study a chess position for a few seconds, rebuild it from memory, and get your score. Free, no sign-up.";

export interface ShareFigure {
  readonly label: string;
  readonly value: string;
}

/** A shared round that has a board: its replay, the figures its card prints, and a round at the same setting. */
export interface SharedRound {
  readonly replay: ReplayRound;
  readonly figures: readonly ShareFigure[];
  readonly legend: NonNullable<ResultPreview["legend"]>;
  readonly play: string;
}

/** What a shared card's page prints and how its link previews, or null when the URL holds no card. */
export interface SharePage {
  readonly kicker: string;
  readonly title: string;
  readonly caption: string;
  readonly image: string;
  readonly alt: string;
  /** Null for a progress card and the daily board, whose cards draw no board. */
  readonly round: SharedRound | null;
}

function sharedRound(share: RoundShare, copy: ResultPreview): SharedRound | null {
  if (share.kind === "daily" || !copy.legend) return null;
  return {
    replay: { board: share.board, studySeconds: share.studySeconds, rebuildSeconds: share.rebuildSeconds },
    figures: [{ label: copy.accuracyLabel, value: `${copy.accuracy}, ${copy.pieces}` }, ...copy.stats.map(({ label, value }) => ({ label, value }))],
    legend: copy.legend,
    play: playHref(share.pieceCount, Math.round(share.memorizeSeconds), "share"),
  };
}

export function sharePageOf(kind: string, code: string): SharePage | null {
  if (kind === "progress") {
    const progress = parseProgress(code);
    if (!progress) return null;
    const copy = progressPreview(progress);
    return { kicker: "Shared progress", title: "A Memory Chess lab record", caption: copy.caption, image: shareImageUrl(kind, code), alt: copy.alt, round: null };
  }
  if (kind === "result") {
    const share = parseResult(code);
    if (!share) return null;
    const copy = resultPreview(share);
    return {
      kicker: "Shared result",
      title: `${copy.accuracy} on a Memory Chess board`,
      caption: copy.caption,
      image: shareImageUrl(kind, code),
      alt: copy.alt,
      round: sharedRound(share, copy),
    };
  }
  return null;
}

/**
 * A shared card's page is for the people it was posted to: its preview is the card, and search has no use for it,
 * so it is noindex and in no sitemap. Each card's URL is its canonical, without the tags it was shared with.
 */
export function sharePageMetadata(kind: ShareKind, code: string, page: SharePage): Metadata {
  const url = `${SITE_URL}/share/${kind}/${code}`;
  const image = { url: page.image, ...PREVIEW_SIZE, type: "image/png", alt: page.alt };
  return {
    title: { absolute: page.caption },
    description: DESCRIPTION,
    alternates: { canonical: url },
    robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
    openGraph: { type: "website", siteName: "Memory Chess", title: page.caption, description: DESCRIPTION, url, images: [image] },
    twitter: { card: "summary_large_image", site: "@TheMemoryChess", title: page.caption, description: DESCRIPTION, images: [image] },
  };
}
